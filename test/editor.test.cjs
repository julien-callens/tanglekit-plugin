const {test} = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../package.json");
const config = require("../language-configuration.json");
const snippets = require("../snippets/tangle.json");

test("language registration and grammar agree on both file extensions", () => {
    const language = manifest.contributes.languages[0];
    assert.deepEqual(language.extensions, [".tangle", ".tngl"]);
    const grammar = require("../syntaxes/tangle.tmLanguage.json");
    assert.deepEqual(grammar.fileTypes, language.extensions.map(ext => ext.slice(1)));
    assert.equal(manifest.contributes.snippets[0].language, language.id);
});

test("indents template tags, functions and conditional branches", () => {
    const increase = new RegExp(config.indentationRules.increaseIndentPattern);
    const decrease = new RegExp(config.indentationRules.decreaseIndentPattern);
    for (const line of ["<code>", '<Child title="hi">', "function click() {", "{{ if (clicks > 0) }}", "{{ else }}"]) {
        assert.match(line, increase);
    }
    for (const line of ["</div>", "}", "{{ else if (ready) }}", "{{ /if }}"]) {
        assert.match(line, decrease);
    }
    for (const line of ["<Child />", "<p>one line</p>", "{{ clicks }}", "let n = 2;"]) {
        assert.doesNotMatch(line, increase);
    }
});

test("snippet defaults compile with the released compiler", async () => {
    const {compileTangleToAST} = await import("tanglekit");
    const wrap = {
        "tngl-component": body => body,
        "tngl-import": body => `<import>${body}</import><Child/>`,
        "tngl-if": body => `<div>${body}</div>`,
        "tngl-click": body => body,
    };
    for (const {prefix, body} of Object.values(snippets)) {
        const defaults = new Map();
        const expanded = body.join("\n").replace(/\$\{(\d+)(?::([^}]+))?\}|\$0/g, (_, key, value) => {
            if (value !== undefined) defaults.set(key, value);
            return defaults.get(key) ?? "";
        });
        assert.ok(compileTangleToAST(wrap[prefix](expanded)).elements, prefix);
    }
});
