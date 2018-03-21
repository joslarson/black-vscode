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

export class BlackEditProvider
    implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
    provideEdits(
        document: TextDocument,
        token: CancellationToken,
        positions?: {
            start: Position;
            end: Position;
        }
    ): Promise<TextEdit[]> {
        // calculate input range and pull text selection from document text
        const lastLine = document.lineCount - 1;
        const lastChar = document.lineAt(lastLine).text.length;
        const start = positions ? positions.start : new Position(0, 0);
        const end = positions ? positions.end : new Position(lastLine, lastChar);
        const range = new Range(start, end);
        const input = document.getText().slice(document.offsetAt(start), document.offsetAt(end));

        // grab config options
        const lineLength = workspace.getConfiguration().get('black.lineLength');
        const fast = workspace.getConfiguration().get('black.fast');

        // format text
        return new Promise<TextEdit[]>((resolve, reject) => {
            let exitCode: number;
            const cmd = exec(
                `black -l ${lineLength} --${fast ? 'fast' : 'safe'} -`,
                (error, stdout, stderr) => {
                    const isSafe = stdout.trim().length > 0;
                    // exit code 1 means something was changed
                    if (isSafe && exitCode === 1 && !token.isCancellationRequested) {
                        // strip trailing newline when doing a selection format
                        resolve([TextEdit.replace(range, positions ? stdout.trim() : stdout)]);
                    } else {
                        // no changes, no text replacement
                        resolve([]);
                        // no change or token cancellation, early exit
                        if (exitCode === 0 || token.isCancellationRequested) return;
                        // we have a problem, log the error
                        console.error(error);
                        // exit code 123 signifies and internal error, most likely unable to parse input
                        if (exitCode === 123)
                            window.showErrorMessage(
                                `Failed to format: unable to parse ${
                                    positions ? 'selection' : 'document'
                                }.`
                            );
                        else if (exitCode === 127)
                            window.showErrorMessage(
                                'Command "black" not found in PATH. Try `pip install black`.'
                            );
                        else window.showErrorMessage('Failed to format: unknown error.');
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
        return this.provideEdits(document, token, { start: range.start, end: range.end });
    }

    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, token);
    }
}
