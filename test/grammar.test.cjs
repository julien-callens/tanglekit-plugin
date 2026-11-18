const {before, test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const tm = require("vscode-textmate");
const onig = require("vscode-oniguruma");
const manifest = require("../package.json");

let grammar;
before(async () => {
    await onig.loadWASM(fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm")));
    const registration = manifest.contributes.grammars[0];
    const registry = new tm.Registry({
        onigLib: Promise.resolve({
            createOnigScanner: patterns => new onig.OnigScanner(patterns),
            createOnigString: text => new onig.OnigString(text),
        }),
        loadGrammar: async scope => scope === registration.scopeName
            ? require(path.join(__dirname, "..", registration.path))
            : null,
    });
    grammar = await registry.loadGrammar(registration.scopeName);
});

function tokenize(source) {
    let stack = tm.INITIAL;
    return source.split("\n").map(line => {
        const result = grammar.tokenizeLine(line, stack);
        stack = result.ruleStack;
        return result.tokens.map(token => ({
            text: line.slice(token.startIndex, token.endIndex),
            scopes: token.scopes,
        }));
    });
}

function hasToken(tokens, text, scope) {
    assert.ok(tokens.some(token => token.text === text && token.scopes.includes(scope)),
        `Expected ${JSON.stringify(text)} in ${scope}: ${JSON.stringify(tokens)}`);
}

test("recognizes bindings after literal text, adjacent tags and spaced attributes", () => {
    const [line] = tokenize('<div>Count = {{ clicks }}</div><codeLabel first="a" second = {{value}} />');
    hasToken(line, "clicks", "variable.other.code.tangle");
    hasToken(line, "codeLabel", "entity.name.tag.tangle");
    hasToken(line, "second", "entity.other.attribute-name.tangle");
    hasToken(line, "value", "meta.embedded.tangle");
    hasToken(line, "/>", "punctuation.definition.tag.end.tangle");
});

test("recognizes conditional directives, return, calls, updates and comparisons", () => {
    const [code, branch] = tokenize('<code>function get(n) { n++; return n === 2; }</code>\n<div>{{if (get(n))}}yes{{else if (n !== 0)}}other{{else}}no{{/if}}</div>');
    hasToken(code, "return", "keyword.control.return.tangle");
    hasToken(code, "++", "keyword.operator.assignment.tangle");
    hasToken(code, "===", "keyword.operator.tangle");
    for (const keyword of ["if", "else if", "else", "/if"]) {
        hasToken(branch, keyword, "keyword.control.conditional.tangle");
    }
    hasToken(branch, "get", "entity.name.function.tangle");
    hasToken(branch, "!==", "keyword.operator.tangle");
});

test("quoted values protect template markers and end at their own delimiter", () => {
    const [imports, props, tag] = tokenize(`<import>Child from "./it's.tngl";</import>
<props>let text = "it's ready"; let flag = false;</props>
<Child label="it's > {{literal}}" next='ok' onClick={{increment()}}/>`);
    hasToken(imports, "from", "keyword.control.import.tangle");
    hasToken(props, "false", "constant.language.boolean.tangle");
    hasToken(tag, "next", "entity.other.attribute-name.tangle");
    assert.ok(tag.some(token => token.text.includes("{{literal}}") &&
        token.scopes.some(scope => scope.startsWith("string.quoted"))));
    hasToken(tag, "increment", "entity.name.function.tangle");
});
