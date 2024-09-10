import { expect, it } from "vitest";
import {
    ArrayLiteral,
    BooleanLiteral,
    CallExpression,
    Expression,
    ExpressionStatement,
    FunctionLiteral,
    HashLiteral,
    Identifier,
    IfExpression,
    IndexExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    ProgramStatement,
    ReturnStatement,
    StringLiteral,
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

        const stmt = program.statements[0] as LetStatement;
        testLetStatement(stmt, test.expectedIdentifier);

        if (!stmt.value) {
            throw new Error("The value is missing");
        }

        if (typeof stmt.value === "string") {
            throw new Error("The value is the wrong type. It's a string.");
        }
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

        const stmt = program.statements[0] as ReturnStatement;
        expect(stmt).toBeInstanceOf(ReturnStatement);
        expect(stmt.tokenLiteral()).toBe("return");
        if (!stmt.returnValue) {
            throw new Error("The returnValue is missing");
        }
        testLiteralExpression(stmt.returnValue, test.expectedValue);
    }
});

it("should parse identifier expressions", () => {
    const input = "foobar;";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const ident = stmt.expression;
    expect(ident).toBeInstanceOf(Identifier);
    expect(ident?.value).toBe("foobar");
    expect(ident?.tokenLiteral()).toBe("foobar");
});

it("should parse integer literal expressions", () => {
    const input = "5;";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const literal = stmt.expression;
    expect(literal).toBeInstanceOf(IntegerLiteral);
    expect(literal?.value).toBe(5);
    expect(literal?.tokenLiteral()).toBe("5");
});

it("should parse prefix expressions", () => {
    const tests = [
        { input: "!5;", operator: "!", value: 5 },
        { input: "-15;", operator: "-", value: 15 },
        { input: "!true;", operator: "!", value: true },
        { input: "!false;", operator: "!", value: false },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);
        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const exp = stmt.expression as PrefixExpression;
        expect(exp).toBeInstanceOf(PrefixExpression);
        expect(exp.operator).toBe(test.operator);

        if (!exp.right) {
            throw new Error("right is missing");
        }

        testLiteralExpression(exp.right, test.value);
    }
});

it("should parse infix expressions", () => {
    const tests = [
        { input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
        { input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
        { input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
        { input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
        { input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
        { input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
        { input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
        { input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5 },
        {
            input: "true == true",
            leftValue: true,
            operator: "==",
            rightValue: true,
        },
        {
            input: "true != false",
            leftValue: true,
            operator: "!=",
            rightValue: false,
        },
        {
            input: "false == false",
            leftValue: false,
            operator: "==",
            rightValue: false,
        },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);
        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        if (!stmt.expression) {
            throw new Error("expression is missing");
        }

        testinfixExpression(
            stmt.expression,
            test.leftValue,
            test.operator,
            test.rightValue,
        );
    }
});

it("should set the proper operator precedence", () => {
    const tests = [
        { input: "-a * b", expected: "((-a) * b)" },
        { input: "!-a", expected: "(!(-a))" },
        { input: "a + b + c", expected: "((a + b) + c)" },
        { input: "a + b - c", expected: "((a + b) - c)" },
        { input: "a * b * c", expected: "((a * b) * c)" },
        { input: "a * b / c", expected: "((a * b) / c)" },
        { input: "a + b / c", expected: "(a + (b / c))" },
        {
            input: "a + b * c + d / e - f",
            expected: "(((a + (b * c)) + (d / e)) - f)",
        },
        { input: "3 + 4; -5 * 5", expected: "(3 + 4)((-5) * 5)" },
        { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
        { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
        {
            input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
            expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        },
        { input: "true", expected: "true" },
        { input: "false", expected: "false" },
        { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
        { input: "3 < 5 == true", expected: "((3 < 5) == true)" },
        { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
        { input: "(5 + 5) * 2", expected: "((5 + 5) * 2)" },
        { input: "2 / (5 + 5)", expected: "(2 / (5 + 5))" },
        {
            input: "(5 + 5) * 2 * (5 + 5)",
            expected: "(((5 + 5) * 2) * (5 + 5))",
        },
        { input: "-(5 + 5)", expected: "(-(5 + 5))" },
        { input: "!(true == true)", expected: "(!(true == true))" },
        { input: "a + add(b * c) + d", expected: "((a + add((b * c))) + d)" },
        {
            input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
            expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
        },
        {
            input: "add(a + b + c * d / f + g)",
            expected: "add((((a + b) + ((c * d) / f)) + g))",
        },
        {
            input: "a * [1, 2, 3, 4][b * c] * d",
            expected: "((a * ([1, 2, 3, 4][(b * c)])) * d)",
        },
        {
            input: "add(a * b[2], b[1], 2 * [1, 2][1])",
            expected: "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))",
        },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);

        const actual = program.string();
        expect(actual).toBe(test.expected);
    }
});

it("should parse boolean expressions", () => {
    const tests = [
        { input: "true;", expectedBoolean: true },
        { input: "false;", expectedBoolean: false },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);
        expect(program.statements).toHaveLength(1);

        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt).toBeInstanceOf(ExpressionStatement);

        const bool = stmt.expression;
        expect(bool).toBeInstanceOf(BooleanLiteral);
        expect(bool?.value).toBe(test.expectedBoolean);
    }
});

it("should parse if expressions", () => {
    const input = "if (x < y) { x }";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const exp = stmt.expression as IfExpression;
    expect(exp).toBeInstanceOf(IfExpression);

    if (!exp.condition) {
        throw new Error("condition is missing");
    }
    testinfixExpression(exp.condition, "x", "<", "y");

    expect(exp.consequence?.statements).toHaveLength(1);

    const consequence = exp.consequence?.statements?.[0] as ExpressionStatement;
    expect(consequence).toBeInstanceOf(ExpressionStatement);

    if (!consequence.expression) {
        throw new Error("consequence.expression is missing");
    }
    testIdentifier(consequence.expression, "x");

    expect(exp.alternative).toBeUndefined();
});

it("should parse if else expressions", () => {
    const input = "if (x < y) { x } else { y }";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const exp = stmt.expression as IfExpression;
    expect(exp).toBeInstanceOf(IfExpression);

    if (!exp.condition) {
        throw new Error("condition is missing");
    }
    testinfixExpression(exp.condition, "x", "<", "y");

    expect(exp.consequence?.statements).toHaveLength(1);

    const consequence = exp.consequence?.statements?.[0] as ExpressionStatement;
    expect(consequence).toBeInstanceOf(ExpressionStatement);

    if (!consequence.expression) {
        throw new Error("consequence.expression is missing");
    }
    testIdentifier(consequence.expression, "x");

    expect(exp.alternative?.statements).toHaveLength(1);

    const alternative = exp.alternative?.statements?.[0] as ExpressionStatement;
    expect(alternative).toBeInstanceOf(ExpressionStatement);

    if (!alternative.expression) {
        throw new Error("alternative.expression is missing");
    }
    testIdentifier(alternative.expression, "y");
});

it("should parse functional literals", () => {
    const input = "fn(x, y) { x + y; }";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const func = stmt.expression as FunctionLiteral;
    expect(func).toBeInstanceOf(FunctionLiteral);
    expect(func.parameters).toHaveLength(2);

    if (!func.parameters) {
        throw new Error("parameters are missing");
    }
    testLiteralExpression(func.parameters[0], "x");
    testLiteralExpression(func.parameters[1], "y");

    expect(func.body?.statements).toHaveLength(1);

    const bodyStmt = func.body?.statements?.[0] as ExpressionStatement;
    expect(bodyStmt).toBeInstanceOf(ExpressionStatement);
});

it("should parse function parameters", () => {
    const tests = [
        { input: "fn() {};", expectedParams: [] },
        { input: "fn(x) {};", expectedParams: ["x"] },
        { input: "fn(x, y, z) {};", expectedParams: ["x", "y", "z"] },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);

        const stmt = program.statements[0] as ExpressionStatement;
        const func = stmt.expression as FunctionLiteral;
        expect(func.parameters).toHaveLength(test.expectedParams.length);

        if (!func.parameters) {
            throw new Error("parameters are missing");
        }

        for (const [index, param] of test.expectedParams.entries()) {
            testLiteralExpression(func.parameters[index], param);
        }
    }
});

it("should parse call expressions", () => {
    const input = "add(1, 2 * 3, 4 + 5);";

    const program = createProgram(input);
    expect(program.statements).toHaveLength(1);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const exp = stmt.expression as CallExpression;
    expect(exp).toBeInstanceOf(CallExpression);

    if (!exp.function) {
        throw new Error("exp.function is missing");
    }

    testIdentifier(exp.function, "add");

    expect(exp.arguments).toHaveLength(3);

    if (!exp.arguments) {
        throw new Error("exp.arguments is missing");
    }

    testLiteralExpression(exp.arguments[0], 1);
    testinfixExpression(exp.arguments[1], 2, "*", 3);
    testinfixExpression(exp.arguments[2], 4, "+", 5);
});

it("should parse call expression parameters", () => {
    type CETest = {
        input: string;
        expectedIdent: string;
        expectedArgs: string[];
    };
    const tests: CETest[] = [
        {
            input: "add();",
            expectedIdent: "add",
            expectedArgs: [],
        },
        {
            input: "add(1);",
            expectedIdent: "add",
            expectedArgs: ["1"],
        },
        {
            input: "add(1, 2 * 3, 4 + 5);",
            expectedIdent: "add",
            expectedArgs: ["1", "(2 * 3)", "(4 + 5)"],
        },
    ];

    for (const test of tests) {
        const program = createProgram(test.input);

        const stmt = program.statements[0] as ExpressionStatement;
        const exp = stmt.expression as CallExpression;
        expect(exp).toBeInstanceOf(CallExpression);

        if (!exp.function) {
            throw new Error("exp.function is missing");
        }

        testIdentifier(exp.function, test.expectedIdent);
        expect(exp.arguments).toHaveLength(test.expectedArgs.length);

        if (!exp.arguments) {
            throw new Error("exp.arguments is missing");
        }

        for (const [index, arg] of test.expectedArgs.entries()) {
            expect(exp.arguments[index].string()).toBe(arg);
        }
    }
});

it("should test string literals", () => {
    const input = '"hello world";';

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const literal = stmt.expression as StringLiteral;
    expect(literal).toBeInstanceOf(StringLiteral);
    expect(literal.value).toBe("hello world");
});

it("should parse an empty array", () => {
    const input = "[]";

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const array = stmt.expression as ArrayLiteral;
    expect(array).toBeInstanceOf(ArrayLiteral);
    expect(array.elements).toHaveLength(0);
});

it("should parse array literals", () => {
    const input = "[1, 2 * 2, 3 + 3]";

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const array = stmt.expression as ArrayLiteral;
    expect(array).toBeInstanceOf(ArrayLiteral);
    expect(array.elements).toHaveLength(3);

    if (!array.elements) {
        throw new Error("array.elements is missing");
    }

    testIntegerLiteral(array.elements[0], 1);
    testinfixExpression(array.elements[1], 2, "*", 2);
    testinfixExpression(array.elements[2], 3, "+", 3);
});

it("should parse index expressions", () => {
    const input = "myArray[1 + 1]";

    const program = createProgram(input);

    const stmt = program.statements[0] as ExpressionStatement;
    const indexExp = stmt.expression as IndexExpression;
    expect(indexExp).toBeInstanceOf(IndexExpression);

    if (!indexExp.left) {
        throw new Error("indexExp.left is missing");
    }

    testIdentifier(indexExp.left, "myArray");

    if (!indexExp.index) {
        throw new Error("indexExp.index is missing");
    }

    testinfixExpression(indexExp.index, 1, "+", 1);
});

it("should parse emtpy hash literals", () => {
    const input = "{}";

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.expression as HashLiteral;
    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.pairs).toHaveLength(0);
});

it("should parse hash literal string keys", () => {
    const input = '{"one": 1, "two": 2, "three": 3}';

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.expression as HashLiteral;
    expect(hash).toBeInstanceOf(HashLiteral);

    const expected = new Map<string, number>();
    expected.set("one", 1);
    expected.set("two", 2);
    expected.set("three", 3);

    expect(hash.pairs).toHaveLength(expected.size);

    for (const [key, value] of hash.pairs?.entries() ?? []) {
        const literal = key as StringLiteral;
        expect(literal).toBeInstanceOf(StringLiteral);

        const expectedValue = expected.get(literal.string());
        testIntegerLiteral(value, expectedValue!);
    }
});

it("should parse hash literal boolean keys", () => {
    const input = "{true: 1, false: 2}";

    const program = createProgram(input);
    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.expression as HashLiteral;
    expect(hash).toBeInstanceOf(HashLiteral);

    const expected = new Map<string, number>();
    expected.set("true", 1);
    expected.set("false", 2);

    expect(hash.pairs).toHaveLength(expected.size);

    for (const [key, value] of hash.pairs?.entries() ?? []) {
        const boolean = key as BooleanLiteral;
        expect(boolean).toBeInstanceOf(BooleanLiteral);

        const expectedValue = expected.get(boolean.string());
        testIntegerLiteral(value, expectedValue!);
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

function testinfixExpression(
    exp: InfixExpression,
    left: number | boolean | string,
    operator: string,
    right: number | boolean | string,
) {
    expect(exp).toBeInstanceOf(InfixExpression);

    if (!exp.left) {
        throw new Error("left is missing");
    }
    testLiteralExpression(exp.left, left);
    expect(exp.operator).toBe(operator);

    if (!exp.right) {
        throw new Error("right is missing");
    }
    testLiteralExpression(exp.right, right);
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

    expect(errors).toHaveLength(0);
}
