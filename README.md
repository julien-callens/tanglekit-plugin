# TangleKit for VS Code

Edit TangleKit components in `.tngl` and `.tangle` files with VS Code 1.96 or later.

- Highlight imports, props, code, tags, attributes, expressions, and template conditionals.
- See the first compiler syntax error in the editor and Problems panel as you type. The bundled TangleKit 0.6.6 parser checks the open document, including unsaved edits. Import resolution and cross-component prop validation run in the Vite build.
- Get indentation for component tags, function bodies, and `if` / `else` branches.
- Use the following prefixes in **Insert Snippet** or completion suggestions.

| Prefix | Inserts |
| --- | --- |
| `tngl-component` | A component with a default prop and a root element |
| `tngl-import` | A component import inside an existing `<import>` block |
| `tngl-if` | An `if` / `else` template block |
| `tngl-click` | A button that calls a handler |

The extension runs on desktop and web VS Code. See the [TangleKit compiler documentation](https://github.com/julien-callens/tanglekit/blob/main/tangle/README.md) for the language examples.
