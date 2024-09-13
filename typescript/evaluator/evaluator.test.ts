import { expect, it } from "vitest";
import { Lexer } from "../lexer/Lexer.js";
import { Environment } from "../object/environment.js";
import { Integer, type MObject } from "../object/object.js";
import { Parser } from "../parser/parser.js";
import { evaluator } from "./evaluator.js";

it("should evaluate integer expressions", () => {
    const tests: { input: string; expected: number }[] = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        console.log('eval: ', evaluated);
        testIntegerObject(evaluated, test.expected);
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
    const result = obj as Integer;
    expect(result).toBeInstanceOf(Integer);
    expect(result.value).toBe(expected);
}
