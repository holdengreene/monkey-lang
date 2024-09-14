import { expect, it } from "vitest";
import { Lexer } from "../lexer/Lexer.js";
import { newEnvironment } from "../object/environment.js";
import {
    BooleanObj,
    FunctionObj,
    IntegerObj,
    type MObject,
} from "../object/object.js";
import { Parser } from "../parser/parser.js";
import { evaluator, NULL } from "./evaluator.js";

it("should evaluate integer expressions", () => {
    const tests: { input: string; expected: number }[] = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 },
        { input: "-5", expected: -5 },
        { input: "-10", expected: -10 },
        { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
        { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
        { input: "-50 + 100 + -50", expected: 0 },
        { input: "5 * 2 + 10", expected: 20 },
        { input: "5 + 2 * 10", expected: 25 },
        { input: "20 + 2 * -10", expected: 0 },
        { input: "50 / 2 * 2 + 10", expected: 60 },
        { input: "2 * (5 + 10)", expected: 30 },
        { input: "3 * 3 * 3 + 10", expected: 37 },
        { input: "3 * (3 * 3) + 10", expected: 37 },
        { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

it("should evaluate boolean expressions", () => {
    const tests: { input: string; expected: boolean }[] = [
        { input: "true", expected: true },
        { input: "false", expected: false },
        { input: "1 < 2", expected: true },
        { input: "1 > 2", expected: false },
        { input: "1 < 1", expected: false },
        { input: "1 > 1", expected: false },
        { input: "1 == 1", expected: true },
        { input: "1 != 1", expected: false },
        { input: "1 == 2", expected: false },
        { input: "1 != 2", expected: true },
        { input: "true == true", expected: true },
        { input: "false == false", expected: true },
        { input: "true == false", expected: false },
        { input: "true != false", expected: true },
        { input: "false != true", expected: true },
        { input: "(1 < 2) == true", expected: true },
        { input: "(1 < 2) == false", expected: false },
        { input: "(1 > 2) == true", expected: false },
        { input: "(1 > 2) == false", expected: true },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testBooleanObject(evaluated, test.expected);
    }
});

it("should evaluate the bang operator", () => {
    const tests: { input: string; expected: boolean }[] = [
        { input: "!true", expected: false },
        { input: "!false", expected: true },
        { input: "!5", expected: false },
        { input: "!!true", expected: true },
        { input: "!!false", expected: false },
        { input: "!!5", expected: true },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testBooleanObject(evaluated, test.expected);
    }
});

it("should evaluate if else expressions", () => {
    const tests: { input: string; expected: number | null }[] = [
        { input: "if (true) { 10 }", expected: 10 },
        { input: "if (false) { 10 }", expected: null },
        { input: "if (1) { 10 }", expected: 10 },
        { input: "if (1 < 2) { 10 }", expected: 10 },
        { input: "if (1 > 2) { 10 }", expected: null },
        { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
        { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);

        if (typeof test.expected === "number") {
            testIntegerObject(evaluated, test.expected);
        } else {
            testNullObject(evaluated);
        }
    }
});

it("should evaluate return statements", () => {
    const tests: { input: string; expected: number }[] = [
        { input: "return 10;", expected: 10 },
        { input: "return 10; 9;", expected: 10 },
        { input: "return 2 * 5; 9;", expected: 10 },
        { input: "9; return 2 * 5; 9;", expected: 10 },
        { input: "if (10 > 1) { return 10; }", expected: 10 },
        {
            input: `
			if (10 > 1) {
			if (10 > 1) {
				return 10;
			}

			return 1;
			}`,
            expected: 10,
        },
        {
            input: `
        	let f = fn(x) {
        	return x;
        	x + 10;
        	};
        	f(10);`,
            expected: 10,
        },
        {
            input: `
        	let f = fn(x) {
        	let result = x + 10;
        	return result;
        	return 10;
        	};
        	f(10);`,
            expected: 20,
        },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

it("should evaluate let statements", () => {
    const tests: { input: string; expected: number }[] = [
        { input: "let a = 5; a;", expected: 5 },
        { input: "let a = 5 * 5; a;", expected: 25 },
        { input: "let a = 5; let b = a; b;", expected: 5 },
        { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

it("should evalaute function objects", () => {
    const input = "fn(x) { x + 2; };";

    const evaluated = testEval(input);
    const func = evaluated as FunctionObj;
    expect(func).toBeInstanceOf(FunctionObj);
    expect(func.params).toHaveLength(1);
    expect(func.params?.[0].string()).toBe("x");

    const expectedBody = "(x + 2)";
    expect(func.body?.string()).toBe(expectedBody);
});

function testEval(input: string) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    const env = newEnvironment();

    return evaluator(program, env);
}

function testIntegerObject(obj: MObject | undefined, expected: number) {
    const result = obj as IntegerObj;
    expect(result).toBeInstanceOf(IntegerObj);
    expect(result.value).toBe(expected);
}

function testBooleanObject(obj: MObject | undefined, expected: boolean) {
    const result = obj as BooleanObj;
    expect(result).toBeInstanceOf(BooleanObj);
    expect(result.value).toBe(expected);
}

function testNullObject(obj: MObject | undefined) {
    expect(obj).toStrictEqual(NULL);
}
