import { Disposable, ExtensionContext, languages, workspace } from 'vscode';
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

    function registerFormatter() {
        disposeHandlers();
        formatterHandler = languages.registerDocumentFormattingEditProvider('python', provider);
        rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
            'python',
            provider
        );
    }

    registerFormatter();

    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(registerFormatter), {
        dispose: disposeHandlers,
    });
}

export function deactivate() {}
