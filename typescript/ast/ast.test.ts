import { expect, it } from "vitest";
import { tokenItem } from "../token/token.js";
import { LetStatement, Program } from "./ast.js";

it("should properly create ast", () => {
    const stmts = [
        new LetStatement({
            token: {
                type: tokenItem.LET,
                literal: "let",
            },
            name: {
                token: {
                    type: tokenItem.IDENT,
                    literal: "myVar",
                },
                value: "myVar",
            },
            value: {
                token: {
                    type: tokenItem.IDENT,
                    literal: "anotherVar",
                },
                value: "anotherVar",
            },
        }),
    ];

    const program = new Program(stmts);

    expect(program.string()).toBe("let myVar = anotherVar;");
});
