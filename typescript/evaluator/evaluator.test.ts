import { expect, it } from "vitest";
import { Lexer } from "../lexer/Lexer.js";
import { Environment } from "../object/environment.js";
import { BooleanObj, IntegerObj, type MObject } from "../object/object.js";
import { Parser } from "../parser/parser.js";
import { evaluator } from "./evaluator.js";

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

function testEval(input: string) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    const env = new Environment();

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
