/**
 * CAMBRIDGE 9618 PSEUDOCODE ENGINE
 * Contains: Lexer, Parser, Interpreter
 */

// --- CONFIGURATION ---
export const KEYWORDS = [
    "DECLARE", "CONSTANT", "TYPE", "ENDTYPE", "IF", "THEN", "ELSE", "ENDIF",
    "FOR", "TO", "STEP", "NEXT", "WHILE", "DO", "ENDWHILE", "REPEAT", "UNTIL",
    "CASE", "OF", "OTHERWISE", "ENDCASE", "PROCEDURE", "ENDPROCEDURE",
    "FUNCTION", "ENDFUNCTION", "CALL", "RETURN", "RETURNS", "INPUT", "OUTPUT",
    "OPENFILE", "READFILE", "WRITEFILE", "CLOSEFILE", "SEEK", "GETRECORD", "PUTRECORD",
    "BYVAL", "BYREF", "AND", "OR", "NOT", "MOD", "DIV", "CLASS", "PUBLIC", "PRIVATE", "NEW", "INHERITS"
];

const OPERATORS = ["<-", "<>", "<=", ">=", "=", "<", ">", "+", "-", "*", "/", "&"];
const PUNCTUATION = [":", ",", "(", ")", "[", "]", "."];

// --- LEXER ---
const TokenType = {
    KEYWORD: 'KEYWORD', IDENTIFIER: 'IDENTIFIER', NUMBER: 'NUMBER',
    STRING: 'STRING', OPERATOR: 'OPERATOR', PUNCTUATION: 'PUNCTUATION', EOF: 'EOF'
};

export class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
    }
    peek() { return this.pos < this.input.length ? this.input[this.pos] : null; }
    advance() { const c = this.peek(); if (c === '\n') this.line++; this.pos++; return c; }

    tokenize() {
        const tokens = [];
        while (this.pos < this.input.length) {
            const char = this.peek();
            if (/\s/.test(char)) { this.advance(); continue; }
            if (char === '/' && this.input[this.pos + 1] === '/') {
                while (this.peek() !== '\n' && this.peek() !== null) this.advance();
                continue;
            }
            if (/[0-9]/.test(char)) {
                let numStr = "";
                while (this.peek() !== null && /[0-9.]/.test(this.peek())) numStr += this.advance();
                tokens.push({ type: TokenType.NUMBER, value: parseFloat(numStr), line: this.line });
                continue;
            }
            if (char === '"' || char === "'") {
                const quote = this.advance();
                let str = "";
                while (this.peek() !== null && this.peek() !== quote) str += this.advance();
                this.advance(); 
                tokens.push({ type: TokenType.STRING, value: str, line: this.line });
                continue;
            }
            let matchedOp = false;
            for (const op of OPERATORS.sort((a,b) => b.length - a.length)) {
                if (this.input.substr(this.pos, op.length) === op) {
                    tokens.push({ type: TokenType.OPERATOR, value: op, line: this.line });
                    this.pos += op.length;
                    matchedOp = true;
                    break;
                }
            }
            if (matchedOp) continue;
            if (PUNCTUATION.includes(char)) {
                tokens.push({ type: TokenType.PUNCTUATION, value: this.advance(), line: this.line });
                continue;
            }
            if (/[a-zA-Z_]/.test(char)) {
                let ident = "";
                while (this.peek() !== null && /[a-zA-Z0-9_]/.test(this.peek())) ident += this.advance();
                if (KEYWORDS.includes(ident.toUpperCase())) {
                    tokens.push({ type: TokenType.KEYWORD, value: ident.toUpperCase(), line: this.line });
                } else {
                    tokens.push({ type: TokenType.IDENTIFIER, value: ident, line: this.line });
                }
                continue;
            }
            throw new Error(`Unexpected character '${char}' at line ${this.line}`);
        }
        tokens.push({ type: TokenType.EOF, line: this.line });
        return tokens;
    }
}

// --- PARSER ---
export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }
    peek() { return this.tokens[this.current]; }
    previous() { return this.tokens[this.current - 1]; }
    match(types, values) {
        const token = this.peek();
        if (!token) return false;
        const typeMatch = Array.isArray(types) ? types.includes(token.type) : types === token.type;
        const valMatch = values ? (Array.isArray(values) ? values.includes(token.value) : values === token.value) : true;
        if (typeMatch && valMatch) { this.advance(); return true; }
        return false;
    }
    advance() { if (this.peek().type !== TokenType.EOF) this.current++; return this.previous(); }
    consume(type, value, message) {
        if (this.match(type, value)) return this.previous();
        throw new Error(`Error Line ${this.peek().line}: ${message || "Unexpected token"}. Found '${this.peek().value}'`);
    }
    check(type, value) {
        if (this.peek().type === TokenType.EOF) return false;
        const token = this.peek();
        const typeMatch = Array.isArray(type) ? type.includes(token.type) : type === token.type;
        const valMatch = value ? (Array.isArray(value) ? value.includes(token.value) : value === token.value) : true;
        return typeMatch && valMatch;
    }

    parse() {
        const statements = [];
        while (this.peek().type !== TokenType.EOF) { statements.push(this.statement()); }
        return statements;
    }

    statement() {
        const token = this.peek();
        const line = token.line; 
        let stmt = null;

        if (this.match(TokenType.KEYWORD, "DECLARE")) stmt = this.declareStatement();
        else if (this.match(TokenType.KEYWORD, "OUTPUT")) stmt = this.outputStatement();
        else if (this.match(TokenType.KEYWORD, "INPUT")) stmt = this.inputStatement();
        else if (this.match(TokenType.KEYWORD, "IF")) stmt = this.ifStatement();
        else if (this.match(TokenType.KEYWORD, "FOR")) stmt = this.forStatement();
        else if (this.match(TokenType.KEYWORD, "WHILE")) stmt = this.whileStatement();
        else if (this.match(TokenType.KEYWORD, "REPEAT")) stmt = this.repeatStatement();
        else if (this.match(TokenType.KEYWORD, "OPENFILE")) stmt = this.fileOpStatement("OPEN");
        else if (this.match(TokenType.KEYWORD, "READFILE")) stmt = this.fileOpStatement("READ");
        else if (this.match(TokenType.KEYWORD, "WRITEFILE")) stmt = this.fileOpStatement("WRITE");
        else if (this.match(TokenType.KEYWORD, "CLOSEFILE")) stmt = this.fileOpStatement("CLOSE");
        else if (token.type === TokenType.IDENTIFIER) {
            if (this.tokens[this.current + 1].value === "<-" || this.tokens[this.current + 1].value === "[") {
                stmt = this.assignmentStatement();
            } else {
                this.advance();
                stmt = { type: "ExpressionStatement", expr: token.value };
            }
        } else {
            this.advance();
            stmt = { type: "NoOp" };
        }
        stmt.line = line; 
        return stmt;
    }

    // ... Parsing Logic methods ...
    declareStatement() {
        const name = this.consume(TokenType.IDENTIFIER, null, "Expected variable name").value;
        this.consume(TokenType.PUNCTUATION, ":", "Expected ':'");
        let isArray = false;
        if (this.match(TokenType.KEYWORD, "ARRAY")) {
            isArray = true;
            this.consume(TokenType.PUNCTUATION, "[", "Expected '['");
            this.consume(TokenType.NUMBER); this.consume(TokenType.PUNCTUATION, ":"); this.consume(TokenType.NUMBER);
            this.consume(TokenType.PUNCTUATION, "]"); this.consume(TokenType.KEYWORD, "OF");
        }
        const typeToken = this.advance();
        return { type: "Declare", name, varType: typeToken.value, isArray };
    }
    assignmentStatement() {
        const name = this.consume(TokenType.IDENTIFIER, null, "Expected identifier").value;
        let indexExpr = null;
        if (this.match(TokenType.PUNCTUATION, "[")) {
            indexExpr = this.expression();
            this.consume(TokenType.PUNCTUATION, "]");
        }
        this.consume(TokenType.OPERATOR, "<-", "Expected '<-'");
        const value = this.expression();
        return { type: "Assign", name, indexExpr, value };
    }
    outputStatement() {
        const exprs = [];
        do { exprs.push(this.expression()); } while (this.match(TokenType.PUNCTUATION, ","));
        return { type: "Output", exprs };
    }
    inputStatement() {
        const name = this.consume(TokenType.IDENTIFIER, null, "Expected variable").value;
        return { type: "Input", name };
    }
    ifStatement() {
        const condition = this.expression();
        this.consume(TokenType.KEYWORD, "THEN", "Expected THEN");
        const thenBranch = [];
        while (!this.check(TokenType.KEYWORD, ["ELSE", "ENDIF"]) && this.peek().type !== TokenType.EOF) thenBranch.push(this.statement());
        let elseBranch = [];
        if (this.match(TokenType.KEYWORD, "ELSE")) {
            while (!this.check(TokenType.KEYWORD, "ENDIF") && this.peek().type !== TokenType.EOF) elseBranch.push(this.statement());
        }
        this.consume(TokenType.KEYWORD, "ENDIF", "Expected ENDIF");
        return { type: "If", condition, thenBranch, elseBranch };
    }
    whileStatement() {
        const condition = this.expression();
        this.match(TokenType.KEYWORD, "DO");
        const body = [];
        while (!this.check(TokenType.KEYWORD, "ENDWHILE") && this.peek().type !== TokenType.EOF) body.push(this.statement());
        this.consume(TokenType.KEYWORD, "ENDWHILE", "Expected ENDWHILE");
        return { type: "While", condition, body };
    }
    repeatStatement() {
        const body = [];
        while (!this.check(TokenType.KEYWORD, "UNTIL") && this.peek().type !== TokenType.EOF) body.push(this.statement());
        this.consume(TokenType.KEYWORD, "UNTIL", "Expected UNTIL");
        const condition = this.expression();
        return { type: "Repeat", body, condition };
    }
    forStatement() {
        const name = this.consume(TokenType.IDENTIFIER, null, "Expected identifier").value;
        this.consume(TokenType.OPERATOR, "<-");
        const start = this.expression();
        this.consume(TokenType.KEYWORD, "TO");
        const end = this.expression();
        let step = null;
        if (this.match(TokenType.KEYWORD, "STEP")) step = this.expression();
        const body = [];
        while (!this.check(TokenType.KEYWORD, "NEXT") && this.peek().type !== TokenType.EOF) body.push(this.statement());
        this.consume(TokenType.KEYWORD, "NEXT");
        this.match(TokenType.IDENTIFIER, name);
        return { type: "For", name, start, end, step, body };
    }
    fileOpStatement(op) {
        if (op === "OPEN") {
            const filename = this.expression();
            this.consume(TokenType.KEYWORD, "FOR");
            const mode = this.advance().value;
            return { type: "FileOpen", filename, mode };
        }
        if (op === "CLOSE") return { type: "FileClose", filename: this.expression() };
        if (op === "READ") {
            const filename = this.expression();
            this.consume(TokenType.PUNCTUATION, ",");
            const variable = this.consume(TokenType.IDENTIFIER).value;
            return { type: "FileRead", filename, variable };
        }
        if (op === "WRITE") {
            const filename = this.expression();
            this.consume(TokenType.PUNCTUATION, ",");
            const data = this.expression();
            return { type: "FileWrite", filename, data };
        }
    }
    expression() { return this.logicalOr(); }
    logicalOr() {
        let expr = this.logicalAnd();
        while (this.match(TokenType.KEYWORD, "OR")) {
            const right = this.logicalAnd();
            expr = { type: "Binary", left: expr, operator: "OR", right };
        }
        return expr;
    }
    logicalAnd() {
        let expr = this.equality();
        while (this.match(TokenType.KEYWORD, "AND")) {
            const right = this.equality();
            expr = { type: "Binary", left: expr, operator: "AND", right };
        }
        return expr;
    }
    equality() {
        let expr = this.relational();
        while (this.match(TokenType.OPERATOR, ["=", "<>", "&"])) {
            const op = this.previous().value;
            const right = this.relational();
            expr = { type: "Binary", left: expr, operator: op, right };
        }
        return expr;
    }
    relational() {
        let expr = this.additive();
        while (this.match(TokenType.OPERATOR, ["<", ">", "<=", ">="])) {
            const op = this.previous().value;
            const right = this.additive();
            expr = { type: "Binary", left: expr, operator: op, right };
        }
        return expr;
    }
    additive() {
        let expr = this.multiplicative();
        while (this.match(TokenType.OPERATOR, ["+", "-"])) {
            const op = this.previous().value;
            const right = this.multiplicative();
            expr = { type: "Binary", left: expr, operator: op, right };
        }
        return expr;
    }
    multiplicative() {
        let expr = this.unary();
        while (this.match(TokenType.OPERATOR, ["*", "/"]) || this.match(TokenType.KEYWORD, ["DIV", "MOD"])) {
            const op = this.previous().value;
            const right = this.unary();
            expr = { type: "Binary", left: expr, operator: op, right };
        }
        return expr;
    }
    unary() {
        if (this.match(TokenType.KEYWORD, "NOT") || this.match(TokenType.OPERATOR, "-")) {
            const op = this.previous().value;
            const right = this.unary();
            return { type: "Unary", operator: op, right };
        }
        return this.primary();
    }
    primary() {
        if (this.match(TokenType.NUMBER)) return { type: "Literal", value: this.previous().value };
        if (this.match(TokenType.STRING)) return { type: "Literal", value: this.previous().value };
        if (this.match(TokenType.KEYWORD, ["TRUE", "FALSE"])) return { type: "Literal", value: this.previous().value === "TRUE" };
        if (this.match(TokenType.IDENTIFIER)) {
            const name = this.previous().value;
            if (this.match(TokenType.PUNCTUATION, "(")) {
                const args = [];
                if (!this.check(TokenType.PUNCTUATION, ")")) do { args.push(this.expression()); } while (this.match(TokenType.PUNCTUATION, ","));
                this.consume(TokenType.PUNCTUATION, ")");
                return { type: "Call", callee: name, args };
            }
            if (this.match(TokenType.PUNCTUATION, "[")) {
                const index = this.expression();
                this.consume(TokenType.PUNCTUATION, "]");
                return { type: "ArrayAccess", name, index };
            }
            return { type: "Variable", name };
        }
        if (this.match(TokenType.PUNCTUATION, "(")) {
            const expr = this.expression();
            this.consume(TokenType.PUNCTUATION, ")");
            return { type: "Grouping", expr };
        }
        throw new Error(`Unexpected token: ${this.peek()?.value}`);
    }
}

// --- INTERPRETER ---
export class Interpreter {
    constructor(consoleCallback, inputCallback, fileSystem, setFileSystem, stepCallback) {
        this.log = consoleCallback;
        this.askInput = inputCallback;
        this.files = fileSystem;
        this.setFiles = setFileSystem;
        this.onStep = stepCallback;
        this.vars = {};
        this.openHandles = {};
        this.running = true;
        this.delay = 0;
    }

    async execute(statements) {
        try {
            for (const stmt of statements) {
                if (!this.running) break;
                if (this.onStep) await this.onStep(stmt.line, this.vars);
                if (this.delay > 0) await new Promise(r => setTimeout(r, this.delay));
                await this.execStatement(stmt);
            }
            if (this.onStep) await this.onStep(-1, this.vars);
        } catch (err) {
            this.log({ type: 'error', text: err.message });
        }
    }

    async execStatement(stmt) {
        switch (stmt.type) {
            case "Declare":
                this.vars[stmt.name] = { type: stmt.varType, value: stmt.isArray ? {} : (stmt.varType === "STRING" ? "" : 0) };
                break;
            case "Assign":
                const val = await this.evaluate(stmt.value);
                if (!this.vars[stmt.name]) throw new Error(`Variable '${stmt.name}' not declared`);
                if (stmt.indexExpr) {
                    const idx = await this.evaluate(stmt.indexExpr);
                    this.vars[stmt.name].value[idx] = val;
                } else {
                    this.vars[stmt.name].value = val;
                }
                break;
            case "Output":
                let outputText = "";
                for (const exp of stmt.exprs) outputText += String(await this.evaluate(exp));
                this.log({ type: 'output', text: outputText });
                break;
            case "Input":
                const inputVal = await this.askInput(stmt.name);
                if (!this.vars[stmt.name]) throw new Error(`Variable '${stmt.name}' not declared`);
                const numVal = parseFloat(inputVal);
                this.vars[stmt.name].value = isNaN(numVal) ? inputVal : numVal;
                break;
            case "If":
                const cond = await this.evaluate(stmt.condition);
                if (cond) {
                    for (const s of stmt.thenBranch) { if(!this.running) break; await this.execStatement(s); }
                } else {
                    for (const s of stmt.elseBranch) { if(!this.running) break; await this.execStatement(s); }
                }
                break;
            case "While":
                while (await this.evaluate(stmt.condition)) {
                    for (const s of stmt.body) { if(!this.running) break; await this.execStatement(s); }
                    if (!this.running) break;
                }
                break;
            case "Repeat":
                do {
                    for (const s of stmt.body) { if(!this.running) break; await this.execStatement(s); }
                    if (!this.running) break;
                } while (!(await this.evaluate(stmt.condition)));
                break;
            case "For":
                const start = await this.evaluate(stmt.start);
                const end = await this.evaluate(stmt.end);
                const step = stmt.step ? await this.evaluate(stmt.step) : 1;
                this.vars[stmt.name] = { type: 'INTEGER', value: start };
                while (true) {
                    const curr = this.vars[stmt.name].value;
                    if (step > 0 && curr > end) break;
                    if (step < 0 && curr < end) break;
                    for (const s of stmt.body) { if(!this.running) break; await this.execStatement(s); }
                    if (!this.running) break;
                    this.vars[stmt.name].value += step;
                }
                break;
            case "FileOpen":
                const fname = await this.evaluate(stmt.filename);
                if (stmt.mode === 'READ' && !this.files[fname]) throw new Error(`File not found: ${fname}`);
                this.openHandles[fname] = { mode: stmt.mode, ptr: 0 };
                break;
            case "FileRead":
                const rFname = await this.evaluate(stmt.filename);
                const handle = this.openHandles[rFname];
                if (!handle || handle.mode !== 'READ') throw new Error(`File not open for READ: ${rFname}`);
                const lines = this.files[rFname].split('\n');
                this.vars[stmt.variable].value = handle.ptr < lines.length ? lines[handle.ptr++] : "";
                break;
            case "FileWrite":
                const wFname = await this.evaluate(stmt.filename);
                const wData = await this.evaluate(stmt.data);
                if (!this.openHandles[wFname]) throw new Error(`File not open: ${wFname}`);
                const currentContent = this.files[wFname] || "";
                this.files[wFname] = currentContent + (currentContent ? "\n" : "") + wData;
                this.setFiles({...this.files});
                break;
            case "FileClose":
                const cFname = await this.evaluate(stmt.filename);
                delete this.openHandles[cFname];
                break;
        }
    }

    async evaluate(expr) {
        if (expr.type === "Literal") return expr.value;
        if (expr.type === "Variable") {
            if (!this.vars[expr.name]) throw new Error(`Variable '${expr.name}' not declared`);
            return this.vars[expr.name].value;
        }
        if (expr.type === "ArrayAccess") {
            if (!this.vars[expr.name]) throw new Error(`Array '${expr.name}' not declared`);
            const idx = await this.evaluate(expr.index);
            return this.vars[expr.name].value[idx];
        }
        if (expr.type === "Binary") {
            const left = await this.evaluate(expr.left);
            const right = await this.evaluate(expr.right);
            switch(expr.operator) {
                case "+": return left + right;
                case "-": return left - right;
                case "*": return left * right;
                case "/": return left / right;
                case "DIV": return Math.floor(left / right);
                case "MOD": return left % right;
                case "&": return String(left) + String(right);
                case "=": return left === right;
                case "<>": return left !== right;
                case "<": return left < right;
                case ">": return left > right;
                case "<=": return left <= right;
                case ">=": return left >= right;
                case "AND": return left && right;
                case "OR": return left || right;
            }
        }
        if (expr.type === "Call") {
            const argVals = await Promise.all(expr.args.map(a => this.evaluate(a)));
            return this.callBuiltin(expr.callee, argVals);
        }
        return null;
    }

    callBuiltin(name, args) {
        switch(name) {
            case "LENGTH": return String(args[0]).length;
            case "LEFT": return String(args[0]).substring(0, args[1]);
            case "RIGHT": return String(args[0]).substring(String(args[0]).length - args[1]);
            case "MID": return String(args[0]).substring(args[1]-1, args[1]-1+args[2]);
            case "UCASE": 
            case "TO_UPPER": return String(args[0]).toUpperCase();
            case "LCASE": 
            case "TO_LOWER": return String(args[0]).toLowerCase();
            case "INT": return Math.floor(args[0]);
            case "NUM_TO_STR": return String(args[0]);
            case "STR_TO_NUM": return Number(args[0]);
            case "EOF": return false; // Basic mock
            default: throw new Error(`Unknown function ${name}`);
        }
    }
}