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

export function activate(context: ExtensionContext) {
    const provider = new BlackEditProvider();

    // initial formatter registration
    registerFormatter(provider);

    // dispose, then re-register formatter on workspace root change (for multi-root workspaces)
    context.subscriptions.push(
        workspace.onDidChangeWorkspaceFolders(() => registerFormatter(provider)),
        { dispose: disposeHandlers }
    );
}

export function deactivate() {}
