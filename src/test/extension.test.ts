import * as fs from 'fs';
import * as path from 'path';

import * as assert from 'assert';
import { commands, window, workspace } from 'vscode';

suite('Extension Tests', function() {
    test('extension settings are registered', function() {
        const config = workspace.getConfiguration('black', null);
        assert(Number.isInteger(config.get('lineLength') as number));
        assert(typeof config.get('fast') === 'boolean');
        assert(typeof config.get('path') === 'string');
    });

    test('successfully formats documents', async function() {
        this.timeout(10000);
        const fileString = fs.readFileSync(
            path.join(__dirname, '..', '..', 'src', 'test', 'unformatted_test.py'),
            'utf8'
        );
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
