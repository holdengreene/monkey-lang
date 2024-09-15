import { expect, it } from "vitest";
import { Lexer } from "../lexer/Lexer.js";
import { newEnvironment } from "../object/environment.js";
import {
    ArrayObj,
    BooleanObj,
    FunctionObj,
    HashKey,
    HashObj,
    IntegerObj,
    NullObj,
    StringObj,
    type MObject,
} from "../object/object.js";
import { Parser } from "../parser/parser.js";
import { evaluator } from "./evaluator.js";

const NULL = new NullObj();
const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);

type TestsNumber = { input: string; expected: number }[];
type TestsBoolean = { input: string; expected: boolean }[];
type TestsNumberNull = { input: string; expected: number | null }[];

it("should evaluate integer expressions", () => {
    const tests: TestsNumber = [
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
    const tests: TestsBoolean = [
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
    const tests: TestsBoolean = [
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
    const tests: TestsNumberNull = [
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
    const tests: TestsNumber = [
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

it("should handle errors", () => {});

it("should evaluate let statements", () => {
    const tests: TestsNumber = [
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

it("should evaluate function application", () => {
    const tests: TestsNumber = [
        { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
        {
            input: "let identity = fn(x) { return x; }; identity(5);",
            expected: 5,
        },
        { input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
        { input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
        {
            input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
            expected: 20,
        },
        { input: "fn(x) { x; }(5)", expected: 5 },
    ];

    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

it("should create an enclosing environment", () => {
    const input = `let first = 10;
		let second = 10;
		let third = 10;

		let ourFunction = fn(first) {
  			let second = 20;

  			first + second + third;
		};

		ourFunction(20) + first + second;`;

    testIntegerObject(testEval(input), 70);
});

it("should properly closure it up", () => {
    const input = `
		let newAdder = fn(x) {
  			fn(y) { x + y };
		};

		let addTwo = newAdder(2);
		addTwo(2);`;

    testIntegerObject(testEval(input), 4);
});

it("should evaluate string literals", () => {
    const input = '"Hello World!"';

    const str = testEval(input) as StringObj;
    expect(str).toBeInstanceOf(StringObj);
    expect(str.value).toBe("Hello World!");
});

it("should concatenate strings", () => {
    const input = '"Hello" + " " + "World!"';

    const str = testEval(input) as StringObj;
    expect(str).toBeInstanceOf(StringObj);
    expect(str.value).toBe("Hello World!");
});

it("should call builtin functions", () => {});

it("should evaluate array literals", () => {
    const input = "[1, 2 * 2, 3 + 3]";

    const arrayLit = testEval(input) as ArrayObj;
    expect(arrayLit).toBeInstanceOf(ArrayObj);
    expect(arrayLit.elements).toHaveLength(3);

    testIntegerObject(arrayLit.elements[0], 1);
    testIntegerObject(arrayLit.elements[1], 4);
    testIntegerObject(arrayLit.elements[2], 6);
});

it("should allow for array index expressions", () => {
    const tests: TestsNumberNull = [
        {
            input: "[1, 2, 3][0]",
            expected: 1,
        },
        {
            input: "[1, 2, 3][1]",
            expected: 2,
        },
        {
            input: "[1, 2, 3][2]",
            expected: 3,
        },
        {
            input: "let i = 0; [1][i];",
            expected: 1,
        },
        {
            input: "[1, 2, 3][1 + 1];",
            expected: 3,
        },
        {
            input: "let myArray = [1, 2, 3]; myArray[2];",
            expected: 3,
        },
        {
            input: "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",
            expected: 6,
        },
        {
            input: "let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]",
            expected: 2,
        },
        {
            input: "[1, 2, 3][3]",
            expected: null,
        },
        {
            input: "[1, 2, 3][-1]",
            expected: null,
        },
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

it("should evaluate hash literals", () => {
    const input = `let two = "two";
	{
		"one": 10 - 9,
		two: 1 + 1,
		"thr" + "ee": 6 / 2,
		4: 4,
		true: 5,
		false: 6
	}`;

    const hash = testEval(input) as HashObj;
    expect(hash).toBeInstanceOf(HashObj);

    const expected = new Map<string | number, number>();
    expected.set(new StringObj("one").hashKey(), 1);
    expected.set(new StringObj("two").hashKey(), 2);
    expected.set(new StringObj("three").hashKey(), 3);
    expected.set(new IntegerObj(4).hashKey(), 4);
    expected.set(TRUE.hashKey(), 5);
    expected.set(FALSE.hashKey(), 6);

    expect(hash.pairs).toHaveLength(expected.size);

    for (const [expectedKey, expectedValue] of expected) {
        const pair = hash.pairs.get(expectedKey);
        expect(pair).toBeDefined();
        testIntegerObject(pair?.value, expectedValue);
    }
});

it.only("should allow for hash index expressions", () => {
    const tests: TestsNumberNull = [
        {
            input: `{"foo": 5}["foo"]`,
            expected: 5,
        },
        {
            input: `{"foo": 5}["bar"]`,
            expected: null,
        },
        {
            input: `let key = "foo"; {"foo": 5}[key]`,
            expected: 5,
        },
        {
            input: `{}["foo"]`,
            expected: null,
        },
        {
            input: `{5: 5}[5]`,
            expected: 5,
        },
        {
            input: `{true: 5}[true]`,
            expected: 5,
        },
        {
            input: `{false: 5}[false]`,
            expected: 5,
        },
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
