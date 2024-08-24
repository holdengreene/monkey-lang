import { assert, expect, it } from "vitest";
import { tokenItem } from "../token/token.js";
import { Lexer } from "./Lexer.js";

it("should correctly tokenize the input", () => {
    const input = `let five = 5;
    let ten = 10;

    let add = fn(x, y) {
        x + y;
    };

    let result = add(five, ten);
    !-/*5;
    5 < 10 > 5;

    if (5 < 10) {
        return true;
    } else {
        return false;
    }

    10 == 10;
    10 != 9;
    "foobar"
    "foo bar"
    [1, 2];
    {"foo": "bar"}`;

    const tests = [
        [tokenItem.LET, "let"],
        [tokenItem.IDENT, "five"],
        [tokenItem.ASSIGN, "="],
        [tokenItem.INT, "5"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.LET, "let"],
        [tokenItem.IDENT, "ten"],
        [tokenItem.ASSIGN, "="],
        [tokenItem.INT, "10"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.LET, "let"],
        [tokenItem.IDENT, "add"],
        [tokenItem.ASSIGN, "="],
        [tokenItem.FUNCTION, "fn"],
        [tokenItem.LPAREN, "("],
        [tokenItem.IDENT, "x"],
        [tokenItem.COMMA, ","],
        [tokenItem.IDENT, "y"],
        [tokenItem.RPAREN, ")"],
        [tokenItem.LBRACE, "{"],
        [tokenItem.IDENT, "x"],
        [tokenItem.PLUS, "+"],
        [tokenItem.IDENT, "y"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.RBRACE, "}"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.LET, "let"],
        [tokenItem.IDENT, "result"],
        [tokenItem.ASSIGN, "="],
        [tokenItem.IDENT, "add"],
        [tokenItem.LPAREN, "("],
        [tokenItem.IDENT, "five"],
        [tokenItem.COMMA, ","],
        [tokenItem.IDENT, "ten"],
        [tokenItem.RPAREN, ")"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.BANG, "!"],
        [tokenItem.MINUS, "-"],
        [tokenItem.SLASH, "/"],
        [tokenItem.ASTERISK, "*"],
        [tokenItem.INT, "5"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.INT, "5"],
        [tokenItem.LT, "<"],
        [tokenItem.INT, "10"],
        [tokenItem.GT, ">"],
        [tokenItem.INT, "5"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.IF, "if"],
        [tokenItem.LPAREN, "("],
        [tokenItem.INT, "5"],
        [tokenItem.LT, "<"],
        [tokenItem.INT, "10"],
        [tokenItem.RPAREN, ")"],
        [tokenItem.LBRACE, "{"],
        [tokenItem.RETURN, "return"],
        [tokenItem.TRUE, "true"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.RBRACE, "}"],
        [tokenItem.ELSE, "else"],
        [tokenItem.LBRACE, "{"],
        [tokenItem.RETURN, "return"],
        [tokenItem.FALSE, "false"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.RBRACE, "}"],
        [tokenItem.INT, "10"],
        [tokenItem.EQ, "=="],
        [tokenItem.INT, "10"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.INT, "10"],
        [tokenItem.NOT_EQ, "!="],
        [tokenItem.INT, "9"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.STRING, "foobar"],
        [tokenItem.STRING, "foo bar"],
        [tokenItem.LBRACKET, "["],
        [tokenItem.INT, "1"],
        [tokenItem.COMMA, ","],
        [tokenItem.INT, "2"],
        [tokenItem.RBRACKET, "]"],
        [tokenItem.SEMICOLON, ";"],
        [tokenItem.LBRACE, "{"],
        [tokenItem.STRING, "foo"],
        [tokenItem.COLON, ":"],
        [tokenItem.STRING, "bar"],
        [tokenItem.RBRACE, "}"],
        [tokenItem.EOF, ""],
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
        const token = lexer.nextToken();

        expect(token.type).toBe(test[0]);
        expect(token.literal).toBe(test[1]);
    }
});
