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
} from 'vscode';

export interface BlackConfig {
    lineLength: number;
    fast: boolean;
    blackPath: string;
    pythonPath: string;
    rootPath?: string;
    debug: boolean;
}

const REL_PATH_REGEX = /^[\.]{1,2}\//;

export class BlackEditProvider
    implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
    getConfig(resource: Uri): BlackConfig {
        const blackConfig = workspace.getConfiguration('black', resource);
        const pythonConfig = workspace.getConfiguration('python', resource);
        const workspaceFolder = workspace.getWorkspaceFolder(resource);
        return {
            lineLength: blackConfig.get('lineLength') as number,
            fast: blackConfig.get('fast') as boolean,
            blackPath: blackConfig.get('path') as string,
            pythonPath: pythonConfig.get('pythonPath') as string,
            rootPath: workspaceFolder ? workspaceFolder.uri.path : undefined,
            debug: blackConfig.get('debug') as boolean,
        };
    }

    getCommand({ lineLength, fast, blackPath, pythonPath, rootPath, debug }: BlackConfig): string {
        // convert relative pythonPath to absolute pythonPath based on current rootPath
        if (REL_PATH_REGEX.test(pythonPath) && rootPath)
            pythonPath = path.join(rootPath, pythonPath);
        // convert relative blackPath to absolute blackPath based on current rootPath
        if (REL_PATH_REGEX.test(blackPath) && rootPath) blackPath = path.join(rootPath, blackPath);
        // prefix command with python path from python extension when setting exists
        const hasCustomPath = blackPath !== 'black';
        const pythonPrefix =
            pythonPath && pythonPath !== 'python' && !hasCustomPath ? `${pythonPath} -m ` : '';

        const result = `${pythonPrefix}${blackPath} -l ${lineLength}${fast ? ' --fast' : ''} -`;

        if (debug) window.showInformationMessage(result); // notify command string in debug mode

        return result;
    }

    provideEdits(
        document: TextDocument,
        token: CancellationToken,
        command: string,
        positions?: { start: Position; end: Position }
    ): Promise<TextEdit[]> {
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
        return new Promise<TextEdit[]>((resolve, reject) => {
            let exitCode: number;
            const blackProcess = exec(command, (error, stdout, stderr) => {
                const hasInput = input.length > 0;
                const hasOutput = stdout.trim().length > 0;

                // exit code 0 means success with no change, code 1 means success with change
                // but we can't trust exit codes by themselves, since we might get code 1 as
                // an error if black is not installed. So to be safe, we make sure there is an
                // input and an output as well, before saying it's succeeded
                const cancelled = token.isCancellationRequested;
                const succeeded = hasInput && hasOutput && (exitCode === 0 || exitCode === 1);
                const changed = exitCode === 1;

                if (!cancelled && succeeded && changed) {
                    // trim trailing newline when doing a selection format that does not
                    // include the entire last line, otherwise leave the extra newline
                    const isDocEnd = end.line === lastLine && end.character === lastChar;
                    const shouldTrim = positions && !isDocEnd;
                    resolve([TextEdit.replace(range, shouldTrim ? stdout.trim() : stdout)]);
                } else {
                    // no changes, no text replacement
                    resolve([]);
                    // cancelled, no input, or success with no change: early exit
                    if (cancelled || !hasInput || succeeded) return;

                    // convert exit code 1 from python -m to 127 when black not installed
                    if (error.message.indexOf('No module named black') > -1) exitCode = 127;

                    // we have a problem, log the error
                    console.error(`exitCode: ${exitCode}\n`, error);
                    // exit code 123 signifies and internal error, most likely unable to parse input
                    if (exitCode === 123)
                        window.showErrorMessage(
                            `Failed to format: unable to parse ${
                                positions ? 'selection' : 'document'
                            }.`
                        );
                    else if (exitCode === 127)
                        window.showErrorMessage(
                            'Command "black" not found. Try `pip install black`.'
                        );
                    else window.showErrorMessage('Failed to format: unknown error.');
                }
            }).on('exit', function(code) {
                // capture the exit code for use above
                exitCode = code;
            });
            // send code to be formatted into stdin
            blackProcess.stdin.write(input);
            blackProcess.stdin.end();
        });
    }

    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, token, this.getCommand(this.getConfig(document.uri)), {
            start: range.start,
            end: range.end,
        });
    }

    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, token, this.getCommand(this.getConfig(document.uri)));
    }
}
