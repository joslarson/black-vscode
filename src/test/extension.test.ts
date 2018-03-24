import * as fs from 'fs';
import * as path from 'path';

import * as assert from 'assert';
import { commands, window, workspace } from 'vscode';

import { BlackEditProvider, BlackConfig } from '../BlackEditProvider';

suite('Extension Tests', function() {
    test('extension settings are registered', function() {
        const config = workspace.getConfiguration('black', null);
        assert(Number.isInteger(config.get('lineLength') as number));
        assert(typeof config.get('fast') === 'boolean');
        assert(typeof config.get('path') === 'string');
        assert(typeof config.get('debug') === 'boolean');
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

    test('creates correct command based on settings', function() {
        const blackEditProvider = new BlackEditProvider();
        const config: BlackConfig = {
            lineLength: 88,
            fast: false,
            blackPath: 'black',
            pythonPath: 'python',
            rootPath: undefined,
            debug: false,
        };
        const rootPath = '/root/path/';
        const pythonPath = '/abs/path/to/python';
        const relPythonPath1 = './rel/path/to/python';
        const relPythonPath2 = '../rel/path/to/python';
        const varPythonPath1 = '${workspaceFolder}/var/path/to/python';
        const varPythonPath2 = '${workspaceRoot}/var/path/to/python';
        const blackPath = '/abs/path/to/black';
        const relBlackPath = './rel/path/to/black';
        const varBlackPath1 = '${workspaceFolder}/var/path/to/black';
        const varBlackPath2 = '${workspaceRoot}/var/path/to/black';

        // line length, no custom paths
        assert(blackEditProvider.getCommand(config) === 'black -l 88 -');
        // fast option, no custom paths
        assert(blackEditProvider.getCommand({ ...config, fast: true }) === 'black -l 88 --fast -');
        // absolute python path
        assert(
            blackEditProvider.getCommand({ ...config, pythonPath }) ===
                `${pythonPath} -m black -l 88 -`
        );
        // relative python path
        assert(
            blackEditProvider.getCommand({
                ...config,
                rootPath,
                pythonPath: relPythonPath1,
            }) === '/root/path/rel/path/to/python -m black -l 88 -'
        );
        // relative path to python with '..'
        assert(
            blackEditProvider.getCommand({
                ...config,
                rootPath,
                pythonPath: relPythonPath2,
            }) === '/root/rel/path/to/python -m black -l 88 -'
        );
        // ${workspaceFolder} var in pythonPath
        assert(
            blackEditProvider.getCommand({ ...config, pythonPath: varPythonPath1, rootPath }) ===
                '/root/path/var/path/to/python -m black -l 88 -'
        );
        // ${workspaceRoot} var in pythonPath
        assert(
            blackEditProvider.getCommand({ ...config, pythonPath: varPythonPath2, rootPath }) ===
                '/root/path/var/path/to/python -m black -l 88 -'
        );
        // absolute black path
        assert(blackEditProvider.getCommand({ ...config, blackPath }) === `${blackPath} -l 88 -`);
        // relative black path
        assert(
            blackEditProvider.getCommand({
                ...config,
                rootPath,
                blackPath: relBlackPath,
            }) === '/root/path/rel/path/to/black -l 88 -'
        );
        // selects blackPath over pythonPath
        assert(
            blackEditProvider.getCommand({ ...config, rootPath, pythonPath, blackPath }) ===
                `${blackPath} -l 88 -`
        );
        // ${workspaceFolder} var in blackPath
        assert(
            blackEditProvider.getCommand({ ...config, blackPath: varBlackPath1, rootPath }) ===
                '/root/path/var/path/to/black -l 88 -'
        );
        // ${workspaceRoot} var in blackPath
        assert(
            blackEditProvider.getCommand({ ...config, blackPath: varBlackPath2, rootPath }) ===
                '/root/path/var/path/to/black -l 88 -'
        );
    });
});
