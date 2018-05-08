import { exec } from 'child_process';
import { Disposable, ExtensionContext, languages, workspace, window } from 'vscode';
import { BlackEditProvider } from './BlackEditProvider';
import { blackVersionIsIncompatible } from './utils';

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

function disposeHandlers() {
    if (formatterHandler) formatterHandler.dispose();
    if (rangeFormatterHandler) rangeFormatterHandler.dispose();

    formatterHandler = undefined;
    rangeFormatterHandler = undefined;
}

// bundle formatter registration logic for reuse
async function registerFormatter(provider: BlackEditProvider) {
    disposeHandlers();
    languages.registerDocumentFormattingEditProvider('python', provider);
    languages.registerDocumentRangeFormattingEditProvider('python', provider);

    // check black version compatibility
    const versionErrorMessage = await blackVersionIsIncompatible(provider);
    if (versionErrorMessage) {
        window.showErrorMessage(versionErrorMessage);
        provider.debug(versionErrorMessage);
        provider.hasCompatibleBlackVersion = false;
    }
}

export async function activate(context: ExtensionContext) {
    const providerArgs: string[] = [];

    // workaround for vscode issue: https://github.com/Microsoft/vscode/issues/16261
    if (process.platform === 'darwin' && !process.env.LANG) {
        await new Promise((resolve, reject) =>
            exec(
                `echo $(defaults read -g AppleLanguages | sed '/"/!d;s/["[:space:]]//g;s/-/_/').UTF-8`,
                (error, stdout, stderr) => {
                    // if there's an unexpected error, skip this
                    if (!error) {
                        const langCode = stdout.trim();
                        // make sure stdout matches a valid language code pattern
                        if (langCode.match(/^[a-z]{2}_[A-Z]{2}\.UTF-8$/)) {
                            providerArgs.push(`LANG=${langCode} `);
                        }
                    }
                    resolve();
                }
            )
        );
    }

    const provider = new BlackEditProvider(...providerArgs);

    // initial formatter registration
    registerFormatter(provider);

    // dispose, then re-register formatter on workspace root change (for multi-root workspaces)
    context.subscriptions.push(
        workspace.onDidChangeWorkspaceFolders(() => registerFormatter(provider)),
        { dispose: disposeHandlers }
    );
}

export function deactivate() {}
