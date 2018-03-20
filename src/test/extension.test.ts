import * as fs from 'fs';
import * as path from 'path';

import * as assert from 'assert';
import { commands, window, workspace } from 'vscode';

suite('Extension Tests', function() {
    test('extension settings are registered', function() {
        assert(Number.isInteger(workspace.getConfiguration().get('black.lineLength') as number));
        assert(typeof workspace.getConfiguration().get('black.fast') === 'boolean');
    });

    test('successfully formats documents', async function() {
        this.timeout(10000);
        const fileString = fs.readFileSync(path.join('src', 'test', 'unformatted_test.py'), 'utf8');
        const doc = await workspace.openTextDocument({ language: 'python', content: fileString });
        const unformatted = doc.getText();
        const preLength = doc.lineCount;
        await window.showTextDocument(doc);
        await commands.executeCommand('editor.action.formatDocument');
        const formatted = doc.getText();
        const postLength = doc.lineCount;

        // test that the output is different than the input and that it is longer, line-wise
        assert.notEqual(unformatted, formatted);
        assert(postLength > preLength);
    });
});
