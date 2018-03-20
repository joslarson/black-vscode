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
    window,
    workspace,
} from 'vscode';

interface BlackConfig {
    lineLength: number;
    fast: boolean;
    rangeStart: Position;
    rangeEnd: Position;
}

export class BlackEditProvider
    implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
    provideEdits(document: TextDocument, options: Partial<BlackConfig>): Promise<TextEdit[]> {
        const lastLine = document.lineCount - 1;
        const start = options.rangeStart || new Position(0, 0);
        const end =
            options.rangeEnd || new Position(lastLine, document.lineAt(lastLine).text.length);
        let range = new Range(start, end);
        const input = document.getText().slice(document.offsetAt(start), document.offsetAt(end));

        // grab config options
        const lineLength = workspace.getConfiguration().get('black.lineLength');
        const fast = workspace.getConfiguration().get('black.fast');

        return new Promise<TextEdit[]>((resolve, reject) => {
            let exitCode: number;
            const cmd = exec(
                `black -l ${lineLength} --${fast ? 'fast' : 'safe'} -`,
                (error, stdout, stderr) => {
                    // exit code 1 means something was changed
                    if (exitCode === 1) {
                        // strip trailing newline when doing a selection format
                        resolve([
                            TextEdit.replace(range, options.rangeEnd ? stdout.trim() : stdout),
                        ]);
                    } else {
                        resolve([]);
                        // exit code 123 signifies and internal error, most likely unable to parse input
                        if (exitCode === 123) {
                            console.error(error);
                            window.showErrorMessage(
                                `Failed to format: unable to parse ${
                                    options.rangeEnd ? 'selection' : 'document'
                                }.`
                            );
                        } else if (exitCode === 127) {
                            window.showErrorMessage(
                                'Command "black" not found in PATH. Try `pip install black`.'
                            );
                        }
                    }
                }
            ).on('exit', function(code) {
                // capture the exit code for use above
                exitCode = code;
            });
            // send code to be formatted into stdin
            cmd.stdin.write(input);
            cmd.stdin.end();
        });
    }

    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, {
            rangeStart: range.start,
            rangeEnd: range.end,
        });
    }

    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, {});
    }
}
