import * as vscode from "vscode";
import {compileTangleToAST} from "tanglekit";

function diagnosticsFor(document) {
    try {
        compileTangleToAST(document.getText());
        return [];
    } catch (error) {
        const message = error.message.replace(/^Compilation failed due to syntax errors\. /, "");
        const location = /at line (\d+):(\d+)/.exec(message);
        const line = location ? Math.min(Number(location[1]) - 1, document.lineCount - 1) : 0;
        const column = location ? Number(location[2]) : 0;
        const start = document.validatePosition(new vscode.Position(line, column));
        const range = document.getWordRangeAtPosition(start) ??
            document.validateRange(new vscode.Range(start, start.translate(0, 1)));
        const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diagnostic.source = "TangleKit";
        return [diagnostic];
    }
}

export function activate(context) {
    const collection = vscode.languages.createDiagnosticCollection("tangle");
    const pending = new Map();

    function cancel(document) {
        const key = document.uri.toString();
        clearTimeout(pending.get(key));
        pending.delete(key);
    }

    function refresh(document) {
        cancel(document);
        if (document.languageId === "tangle") collection.set(document.uri, diagnosticsFor(document));
    }

    context.subscriptions.push(collection,
        vscode.workspace.onDidOpenTextDocument(refresh),
        vscode.workspace.onDidChangeTextDocument(({document}) => {
            if (document.languageId !== "tangle") return;
            cancel(document);
            pending.set(document.uri.toString(), setTimeout(() => refresh(document), 200));
        }),
        vscode.workspace.onDidCloseTextDocument(document => {
            cancel(document);
            collection.delete(document.uri);
        }),
        {dispose() { for (const timer of pending.values()) clearTimeout(timer); }},
    );
    vscode.workspace.textDocuments.forEach(refresh);
}
