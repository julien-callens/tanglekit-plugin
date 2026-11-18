const assert = require("node:assert/strict");
const {setTimeout: delay} = require("node:timers/promises");
const vscode = require("vscode");

async function waitFor(read, accepts) {
    for (let i = 0; i < 100; i++) {
        const value = read();
        if (accepts(value)) return value;
        await delay(50);
    }
    assert.fail("Timed out waiting for VS Code diagnostics");
}

exports.run = async () => {
    await vscode.extensions.getExtension("JulienCallens.tanglekit").activate();
    const doc = await vscode.workspace.openTextDocument({language: "tangle", content: "<div>\n</span>"});
    const diagnostics = () => vscode.languages.getDiagnostics(doc.uri).filter(d => d.source === "TangleKit");
    const [error] = await waitFor(diagnostics, items => items.length === 1);
    assert.match(error.message, /expected <\/div>, found <\/span>/);
    assert.equal(error.range.start.line, 1);
    assert.equal(doc.getText(error.range), "span");
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, error.range, "div");
    assert.ok(await vscode.workspace.applyEdit(edit));
    await waitFor(diagnostics, items => items.length === 0);
};
