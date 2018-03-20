import { workspace } from 'vscode';

import * as assert from 'assert';

suite('Extension Tests', function() {
    test('extension settings are registered', function() {
        assert(Number.isInteger(workspace.getConfiguration().get('black.lineLength') as number));
        assert(typeof workspace.getConfiguration().get('black.fast') === 'boolean');
    });
});
