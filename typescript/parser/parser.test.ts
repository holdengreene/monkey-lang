import { expect, it } from "vitest";
import {
    BooleanLiteral,
    Expression,
    Identifier,
    IntegerLiteral,
    LetStatement,
    ProgramStatement,
    ReturnStatement,
} from "../ast/ast.js";
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
        const program = createProgram(test.input);

        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0];

        testLetStatement(stmt, test.expectedIdentifier);
        testLiteralExpression(stmt.value, test.expectedValue);
    }
});

it("should parse return statements", () => {
    const tests = [
        { input: "return 5;", expectedValue: 5 },
        { input: "return foobar;", expectedValue: "foobar" },
        { input: "return true;", expectedValue: true },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);

        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0];

        expect(stmt).toBeInstanceOf(ReturnStatement);
        expect(stmt.tokenLiteral()).toBe("return");
        testLiteralExpression(stmt.returnValue, test.expectedValue);
    }
});

function createProgram(input: string) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    checkParserErrors(parser);

    return program;
}

function testLetStatement(statement: ProgramStatement, name: string) {
    expect(statement).toBeInstanceOf(LetStatement);
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
    expect(exp).toBeInstanceOf(Identifier);
    expect(exp.value).toBe(value);
    expect(exp.tokenLiteral()).toBe(value);
}

function testIntegerLiteral(intLit: IntegerLiteral, value: number) {
    expect(intLit).toBeInstanceOf(IntegerLiteral);
    expect(intLit.value).toBe(value);
    expect(intLit.tokenLiteral()).toBe(value.toString());
}

function testBooleanLiteral(exp: BooleanLiteral, value: boolean) {
    expect(exp).toBeInstanceOf(BooleanLiteral);
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
