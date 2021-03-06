import * as path from 'path';
import { exec } from 'child_process';

import {
    CancellationToken,
    DocumentFormattingEditProvider,
    DocumentRangeFormattingEditProvider,
    FormattingOptions,
    Range,
    TextDocument,
    TextEdit,
    Position,
    Uri,
    window,
    workspace,
    OutputChannel,
} from 'vscode';
import { replaceVarInPath, blackVersionIsIncompatible } from './utils';

export interface BlackConfig {
    lineLength: number;
    fast: boolean;
    blackPath: string;
    pythonPath?: string;
    rootPath?: string;
    debug: boolean;
}

const REL_PATH_REGEX = /^[\.]{1,2}\//;

export class BlackEditProvider
    implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
    channel?: OutputChannel;
    hasCompatibleBlackVersion?: boolean;
    commandPrefix: string;

    constructor(commandPrefix = '') {
        this.commandPrefix = commandPrefix;
    }

    debug(msg: string, newLine = true) {
        const debug: boolean = workspace.getConfiguration('black', null).get('debug') as boolean;
        if (debug) {
            if (this.channel === undefined)
                this.channel = window.createOutputChannel('Black – Python code formatter');
            newLine ? this.channel.appendLine(msg) : this.channel.append(msg);
            this.channel.show();
        }
    }

    getConfig(resource: Uri | null): BlackConfig {
        const blackConfig = workspace.getConfiguration('black', resource);
        const pythonConfig = workspace.getConfiguration('python', resource);
        const workspaceFolder = resource
            ? workspace.getWorkspaceFolder(resource)
            : workspace.workspaceFolders && workspace.workspaceFolders[0];
        return {
            lineLength: blackConfig.get('lineLength') as number,
            fast: blackConfig.get('fast') as boolean,
            blackPath: blackConfig.get('path') as string,
            pythonPath: pythonConfig.get('pythonPath') as string | undefined,
            rootPath: workspaceFolder ? (workspaceFolder.uri.path as string) : undefined,
            debug: blackConfig.get('debug') as boolean,
        };
    }

    getCommand({ lineLength, fast, blackPath, pythonPath, rootPath, debug }: BlackConfig): string {
        // replace ${workspaceRoot} var in paths with rootPath
        if (rootPath) {
            blackPath = replaceVarInPath(blackPath, '${workspaceFolder}', rootPath);
            blackPath = replaceVarInPath(blackPath, '${workspaceRoot}', rootPath);
            if (pythonPath) {
                pythonPath = replaceVarInPath(pythonPath, '${workspaceFolder}', rootPath);
                pythonPath = replaceVarInPath(pythonPath, '${workspaceRoot}', rootPath);
            }
        }
        // convert relative pythonPath to absolute pythonPath based on current rootPath
        if (pythonPath && REL_PATH_REGEX.test(pythonPath) && rootPath)
            pythonPath = path.join(rootPath, pythonPath);
        // convert relative blackPath to absolute blackPath based on current rootPath
        if (REL_PATH_REGEX.test(blackPath) && rootPath) blackPath = path.join(rootPath, blackPath);
        // prefix command with python path from python extension when setting exists
        const hasCustomPath = blackPath !== 'black';
        const pythonPrefix =
            pythonPath && pythonPath !== 'python' && !hasCustomPath ? `${pythonPath} -m ` : '';

        return `${this.commandPrefix}${pythonPrefix}${blackPath} -l ${lineLength}${
            fast ? ' --fast' : ''
        } -`;
    }

    async provideEdits(
        document: TextDocument,
        token: CancellationToken,
        command: string,
        positions?: { start: Position; end: Position }
    ): Promise<TextEdit[]> {
        this.debug(''); // start with new line

        // handle incompatible black version
        if (!this.hasCompatibleBlackVersion) {
            const versionErrorMessage = await blackVersionIsIncompatible(this);
            if (versionErrorMessage) {
                window.showErrorMessage(versionErrorMessage);
                this.debug(versionErrorMessage);
                return [];
            } else {
                this.hasCompatibleBlackVersion = true;
            }
        }

        // calculate input range and pull text selection from document text
        const lastLine = document.lineCount - 1;
        const lastChar = document.lineAt(lastLine).text.length;
        const start = positions ? positions.start : new Position(0, 0);
        const end = positions ? positions.end : new Position(lastLine, lastChar);
        const range = new Range(start, end);
        const input = document
            .getText()
            .slice(document.offsetAt(start), document.offsetAt(end))
            .trim();

        // format text
        const edits = await new Promise<TextEdit[]>((resolve, reject) => {
            let exitCode: number;
            const blackProcess = exec(command, (error, stdout, stderr) => {
                const hasInput = input.length > 0;
                const hasOutput = stdout.trim().length > 0;

                // exit code 0 means success with no change, code 1 means success with change
                // but we can't trust exit codes by themselves, since we might get code 1 as
                // an error if black is not installed. So to be safe, we make sure there is an
                // input and an output as well, before saying it's succeeded
                const cancelled = token.isCancellationRequested;
                const succeeded = hasInput && hasOutput && exitCode === 0;
                let hasErrors = false;

                if (!cancelled && succeeded) {
                    // trim trailing newline when doing a selection format that does not
                    // include the entire last line, otherwise leave the extra newline
                    const isDocEnd = end.line === lastLine && end.character === lastChar;
                    const shouldTrim = positions && !isDocEnd;
                    resolve([TextEdit.replace(range, shouldTrim ? stdout.trim() : stdout)]);
                    this.debug('Formatting applied successfully.');
                } else {
                    resolve([]); // no changes, no text replacement
                    console.log('failed to format');
                    const moduleNotFound =
                        error && error.message
                            ? error.message.indexOf('No module named black') > -1
                            : false;
                    console.log('after error');
                    hasErrors = (!cancelled && hasInput && !succeeded) || moduleNotFound;
                    // output status message
                    if (cancelled) {
                        this.debug('Formatting action cancelled.');
                    } else if (!hasInput) {
                        this.debug('Nothing to format: empty input received.');
                    } else if (exitCode === 123) {
                        // exit code 123 signifies and internal error, most likely unable to parse input
                        this.debug('Failed to format: unable to parse input.');
                        window.showErrorMessage(
                            `Failed to format: unable to parse ${
                                positions ? 'selection' : 'document'
                            }.`
                        );
                    } else if (exitCode === 127 || moduleNotFound) {
                        this.debug('Failed to format: "black" command not found.');
                        window.showErrorMessage(
                            'Command "black" not found. Try "pip install black".'
                        );
                    } else {
                        this.debug('Failed to format: unhandled error.');
                        window.showErrorMessage(
                            'Failed to format: unhandled error. Set "black.debug" to true to enable debugging output.'
                        );
                    }
                }
                // log the command that was run
                this.debug(`Command "${command}" resulted in an exit code of ${exitCode}.`);
                // log error if any
                if (hasErrors) this.debug(`${error}`.trim());
            }).on('exit', function(code) {
                // capture the exit code for use above
                exitCode = code;
            });
            // send code to be formatted into stdin
            blackProcess.stdin.write(input);
            blackProcess.stdin.end();
        });

        return edits;
    }

    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        const config = this.getConfig(document.uri);
        return this.provideEdits(document, token, this.getCommand(config), {
            start: range.start,
            end: range.end,
        });
    }

    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        const config = this.getConfig(document.uri);
        return this.provideEdits(document, token, this.getCommand(config));
    }
}
