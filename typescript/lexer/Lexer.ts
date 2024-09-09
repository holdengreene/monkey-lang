import { lookupIdent, type Token, tokenItem } from "../token/token.js";

type chType = string | number;

export class Lexer {
    private position = 0;
    private readPosition = 0;
    private ch!: chType;
    private _0 = "0".charCodeAt(0);
    private _9 = "9".charCodeAt(0);
    private a = "a".charCodeAt(0);
    private z = "z".charCodeAt(0);
    private A = "A".charCodeAt(0);
    private Z = "Z".charCodeAt(0);
    private _ = "_".charCodeAt(0);

    constructor(private input: string) {
        this.readChar();
    }

    public nextToken(): Token {
        let tok: Token = { type: "", literal: "" };

        this.skipWhitespace();
        switch (this.ch) {
            case "=":
                if (this.peekChar() === "=") {
                    const ch = this.ch;
                    this.readChar();
                    const literal = `${ch}${this.ch}`;
                    tok = { type: tokenItem.EQ, literal };
                } else {
                    tok = this.newToken(tokenItem.ASSIGN, this.ch);
                }
                break;
            case "+":
                tok = this.newToken(tokenItem.PLUS, this.ch);
                break;
            case "-":
                tok = this.newToken(tokenItem.MINUS, this.ch);
                break;
            case "!":
                if (this.peekChar() === "=") {
                    const ch = this.ch;
                    this.readChar();
                    const literal = `${ch}${this.ch}`;
                    tok = { type: tokenItem.NOT_EQ, literal };
                } else {
                    tok = this.newToken(tokenItem.BANG, this.ch);
                }
                break;
            case "/":
                tok = this.newToken(tokenItem.SLASH, this.ch);
                break;
            case "*":
                tok = this.newToken(tokenItem.ASTERISK, this.ch);
                break;
            case "<":
                tok = this.newToken(tokenItem.LT, this.ch);
                break;
            case ">":
                tok = this.newToken(tokenItem.GT, this.ch);
                break;
            case ";":
                tok = this.newToken(tokenItem.SEMICOLON, this.ch);
                break;
            case ",":
                tok = this.newToken(tokenItem.COMMA, this.ch);
                break;
            case "(":
                tok = this.newToken(tokenItem.LPAREN, this.ch);
                break;
            case ")":
                tok = this.newToken(tokenItem.RPAREN, this.ch);
                break;
            case "{":
                tok = this.newToken(tokenItem.LBRACE, this.ch);
                break;
            case "}":
                tok = this.newToken(tokenItem.RBRACE, this.ch);
                break;
            case "[":
                tok = this.newToken(tokenItem.LBRACKET, this.ch);
                break;
            case "]":
                tok = this.newToken(tokenItem.RBRACKET, this.ch);
                break;
            case ":":
                tok = this.newToken(tokenItem.COLON, this.ch);
                break;
            case 0:
                tok.literal = "";
                tok.type = tokenItem.EOF;
                break;
            case '"':
                tok.type = tokenItem.STRING;
                tok.literal = this.readString();
                break;
            default:
                if (this.isLetter(this.ch)) {
                    tok.literal = this.readIdentifier();
                    tok.type = lookupIdent(tok.literal);

                    return tok;
                } else if (this.isDigit(this.ch)) {
                    tok.type = tokenItem.INT;
                    tok.literal = this.readNumber();

                    return tok;
                } else {
                    tok = this.newToken(tokenItem.ILLEGAL, this.ch);
                }
        }

        this.readChar();
        return tok;
    }

    private readChar() {
        if (this.readPosition >= this.input.length) {
            this.ch = 0;
        } else {
            this.ch = this.input[this.readPosition];
        }

        this.position = this.readPosition;
        this.readPosition += 1;
    }

    private skipWhitespace() {
        while (
            this.ch === " " ||
            this.ch === "\t" ||
            this.ch === "\n" ||
            this.ch === "\r"
        ) {
            this.readChar();
        }
    }

    private peekChar(): chType {
        if (this.readPosition >= this.input.length) {
            return 0;
        }

        return this.input[this.readPosition];
    }

    private newToken(tokenType: Token["type"], ch: chType): Token {
        return { type: tokenType, literal: ch.toString() };
    }

    private readIdentifier(): string {
        const position = this.position;
        while (this.isLetter(this.ch)) {
            this.readChar();
        }

        return this.input.slice(position, this.position);
    }

    private readNumber(): string {
        const position = this.position;

        while (this.isDigit(this.ch)) {
            this.readChar();
        }

        return this.input.slice(position, this.position);
    }

    private readString(): string {
        const position = this.position + 1;

        do {
            this.readChar();
            // @ts-ignore
        } while (this.ch !== '"' || this.ch == 0);

        return this.input.slice(position, this.position);
    }

    private isLetter(ch: chType): boolean {
        if (typeof ch !== "string") {
            return false;
        }

        const char = ch.charCodeAt(0);
        return (
            (this.a <= char && char <= this.z) ||
            (this.A <= char && char <= this.Z) ||
            char === this._
        );
    }

    private isDigit(ch: chType): boolean {
        if (typeof ch !== "string") {
            return false;
        }

        const char = ch.charCodeAt(0);
        return this._0 <= char && this._9 >= char;
    }
}
