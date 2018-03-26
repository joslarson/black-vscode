import { exec } from 'child_process';

import { Disposable, ExtensionContext, languages, workspace, window } from 'vscode';
import { BlackEditProvider } from './BlackEditProvider';

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

function disposeHandlers() {
    if (formatterHandler) formatterHandler.dispose();
    if (rangeFormatterHandler) rangeFormatterHandler.dispose();

    formatterHandler = undefined;
    rangeFormatterHandler = undefined;
}

export function activate(context: ExtensionContext) {
    const provider = new BlackEditProvider();

    // check that black version is valid
    const checkVersionCmd = `${provider.getCommand(provider.getConfig(null))}-version`;
    console.log(checkVersionCmd);
    let exitCode: number;
    exec(checkVersionCmd, (error, stdout, stderr) => {
        try {
            if (exitCode === 0) {
                const [year, monthMicro] = stdout
                    .split(' ')
                    .slice(-1)[0]
                    .split('.');
                const [month, micro] = monthMicro.split('a');
                const valid = parseInt(year) >= 18 && parseInt(month) >= 3 && parseInt(micro) >= 4;
                if (!valid)
                    window.showErrorMessage(
                        'Black version outdated and no longer supported. Run `pip install -U black`.'
                    );
            }
        } catch {
            // pass
        }
    }).on('exit', code => {
        exitCode = code;
    });

    // bundle formatter registration logic for reuse
    function registerFormatter() {
        disposeHandlers();
        formatterHandler = languages.registerDocumentFormattingEditProvider('python', provider);
        rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
            'python',
            provider
        );
    }

    // initial formatter registration
    registerFormatter();
    // dispose, then re-register formatter on workspace root change (for multi-root workspaces)
    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(registerFormatter), {
        dispose: disposeHandlers,
    });
}

export function deactivate() {}
