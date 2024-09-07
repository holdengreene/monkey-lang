import { expect, it } from "vitest";
import { Expression, Identifier, ProgramStatement } from "../ast/ast.js";
import { Lexer } from "../lexer/Lexer.js";
import { Parser } from "./parser.js";

it("should parse let statements", () => {
    const tests = [
        { input: "let x = 5;", expectedIdentifier: "x", expectedValue: 5 },
        {
            input: "let y = true;",
            expectedIdentifier: "y",
            expectedValue: true,
        },
        {
            input: "let foobar = y;",
            expectedIdentifier: "foobar",
            expectedValue: "y",
        },
    ];

    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        checkParserErrors(parser);

        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0];

        testLetStatement(stmt, test.expectedIdentifier);
        testLiteralExpression(stmt.value, test.expectedValue);
    }
});

function testLetStatement(statement: ProgramStatement, name: string) {
    expect(statement.tokenLiteral()).toBe("let");
    expect(statement.name?.value).toBe(name);
    expect(statement.name?.tokenLiteral()).toBe(name);
}

function testLiteralExpression(exp: Expression, expected: any) {
    switch (typeof expected) {
        case "string":
            return testIdentifier(exp, expected);
        case "number":
            return testIntegerLiteral(exp, expected);
        case "boolean":
            return testBooleanLiteral(exp, expected);
    }

    throw new Error(`type of exp not handled. got=${typeof exp}`);
}

function testIdentifier(exp: Identifier, value: string) {
    expect(exp.value).toBe(value);
    expect(exp.tokenLiteral()).toBe(value);
}

function testIntegerLiteral(intLit: Expression, value: number) {
    expect(intLit.value).toBe(value);
    expect(intLit.tokenLiteral()).toBe(value.toString());
}

function testBooleanLiteral(exp: Expression, value: boolean) {
    expect(exp.value).toBe(value);
    expect(exp.tokenLiteral()).toBe(`${value}`);
}

function checkParserErrors(parser: Parser) {
    const errors = parser.getErrors;

    if (errors.length === 0) {
        return;
    }

    console.error(`parser had ${errors.length} errors`);

    for (const error of errors) {
        console.error(`parser error: ${error}`);
    }

    expect(errors.length).toHaveLength(0);
}
