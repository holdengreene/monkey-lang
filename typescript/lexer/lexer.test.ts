import { expect, it } from "vitest";
import { TokenItem } from "../token/token.js";
import { Lexer } from "./Lexer.js";

it("should correctly tokenize the input", () => {
    const input = `
    let five = 5;
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
    {"foo": "bar"}
    for (let i = 0; i < len(foo); i + 1){};`;

    const tests = [
        [TokenItem.LET, "let"],
        [TokenItem.IDENT, "five"],
        [TokenItem.ASSIGN, "="],
        [TokenItem.INT, "5"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.LET, "let"],
        [TokenItem.IDENT, "ten"],
        [TokenItem.ASSIGN, "="],
        [TokenItem.INT, "10"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.LET, "let"],
        [TokenItem.IDENT, "add"],
        [TokenItem.ASSIGN, "="],
        [TokenItem.FUNCTION, "fn"],
        [TokenItem.LPAREN, "("],
        [TokenItem.IDENT, "x"],
        [TokenItem.COMMA, ","],
        [TokenItem.IDENT, "y"],
        [TokenItem.RPAREN, ")"],
        [TokenItem.LBRACE, "{"],
        [TokenItem.IDENT, "x"],
        [TokenItem.PLUS, "+"],
        [TokenItem.IDENT, "y"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.RBRACE, "}"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.LET, "let"],
        [TokenItem.IDENT, "result"],
        [TokenItem.ASSIGN, "="],
        [TokenItem.IDENT, "add"],
        [TokenItem.LPAREN, "("],
        [TokenItem.IDENT, "five"],
        [TokenItem.COMMA, ","],
        [TokenItem.IDENT, "ten"],
        [TokenItem.RPAREN, ")"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.BANG, "!"],
        [TokenItem.MINUS, "-"],
        [TokenItem.SLASH, "/"],
        [TokenItem.ASTERISK, "*"],
        [TokenItem.INT, "5"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.INT, "5"],
        [TokenItem.LT, "<"],
        [TokenItem.INT, "10"],
        [TokenItem.GT, ">"],
        [TokenItem.INT, "5"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.IF, "if"],
        [TokenItem.LPAREN, "("],
        [TokenItem.INT, "5"],
        [TokenItem.LT, "<"],
        [TokenItem.INT, "10"],
        [TokenItem.RPAREN, ")"],
        [TokenItem.LBRACE, "{"],
        [TokenItem.RETURN, "return"],
        [TokenItem.TRUE, "true"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.RBRACE, "}"],
        [TokenItem.ELSE, "else"],
        [TokenItem.LBRACE, "{"],
        [TokenItem.RETURN, "return"],
        [TokenItem.FALSE, "false"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.RBRACE, "}"],
        [TokenItem.INT, "10"],
        [TokenItem.EQ, "=="],
        [TokenItem.INT, "10"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.INT, "10"],
        [TokenItem.NOT_EQ, "!="],
        [TokenItem.INT, "9"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.STRING, "foobar"],
        [TokenItem.STRING, "foo bar"],
        [TokenItem.LBRACKET, "["],
        [TokenItem.INT, "1"],
        [TokenItem.COMMA, ","],
        [TokenItem.INT, "2"],
        [TokenItem.RBRACKET, "]"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.LBRACE, "{"],
        [TokenItem.STRING, "foo"],
        [TokenItem.COLON, ":"],
        [TokenItem.STRING, "bar"],
        [TokenItem.RBRACE, "}"],
        [TokenItem.FOR, "for"],
        [TokenItem.LPAREN, "("],
        [TokenItem.LET, "let"],
        [TokenItem.IDENT, "i"],
        [TokenItem.ASSIGN, "="],
        [TokenItem.INT, "0"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.IDENT, "i"],
        [TokenItem.LT, "<"],
        [TokenItem.IDENT, "len"],
        [TokenItem.LPAREN, "("],
        [TokenItem.IDENT, "foo"],
        [TokenItem.RPAREN, ")"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.IDENT, "i"],
        [TokenItem.PLUS, "+"],
        [TokenItem.INT, "1"],
        [TokenItem.RPAREN, ")"],
        [TokenItem.LBRACE, "{"],
        [TokenItem.RBRACE, "}"],
        [TokenItem.SEMICOLON, ";"],
        [TokenItem.EOF, ""],
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
        const token = lexer.nextToken();

        expect(token.type).toBe(test[0]);
        expect(token.literal).toBe(test[1]);
    }
});
