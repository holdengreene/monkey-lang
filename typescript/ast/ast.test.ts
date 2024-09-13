import { expect, it } from "vitest";
import { TokenItem } from "../token/token.js";
import { Identifier, LetStatement, Program } from "./ast.js";

it("should properly create ast", () => {
    const stmts = [
        new LetStatement({
            token: {
                type: TokenItem.LET,
                literal: "let",
            },
            name: new Identifier({
                token: {
                    type: TokenItem.IDENT,
                    literal: "myVar",
                },
                value: "myVar",
            }),
            value: new Identifier({
                token: {
                    type: TokenItem.IDENT,
                    literal: "anotherVar",
                },
                value: "anotherVar",
            }),
        }),
    ];

    const program = new Program(stmts);

    expect(program.string()).toBe("let myVar = anotherVar;");
});
