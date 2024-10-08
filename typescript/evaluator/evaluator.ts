import {
    ArrayLiteral,
    BlockStatement,
    BooleanLiteral,
    CallExpression,
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
    Program,
    ReturnStatement,
    StringLiteral,
    type ASTNode,
    type Expression,
    type Statement,
} from "../ast/ast.js";
import {
    newEnclosedEnvironment,
    type Environment,
} from "../object/environment.js";
import {
    ArrayObj,
    BooleanObj,
    BuiltinObj,
    ErrorObj,
    FunctionObj,
    Hashable,
    HashObj,
    IntegerObj,
    NullObj,
    ObjectType,
    ReturnValueObj,
    StringObj,
    type HashKey,
    type HashPair,
    type MObject,
} from "../object/object.js";
import { builtins } from "./builtins.js";

export const NULL = new NullObj();
export const TRUE = new BooleanObj(true);
export const FALSE = new BooleanObj(false);

export function evaluator(
    node: ASTNode,
    env: Environment,
): MObject | undefined {
    switch (true) {
        // Statements
        case node instanceof Program:
            return evalProgram(node.statements, env);

        case node instanceof ExpressionStatement:
            return evaluator(node.expression!, env);

        case node instanceof LetStatement:
            const value = evaluator(node.value!, env);
            if (isError(value)) {
                return value;
            }
            env.set(node.name?.value!, value!);
            break;

        case node instanceof BlockStatement:
            return evalBlockStatement(node, env);

        case node instanceof ReturnStatement:
            const val = evaluator(node.returnValue!, env);
            if (isError(val)) {
                return val;
            }
            return new ReturnValueObj(val!);

        // Expressions
        case node instanceof IntegerLiteral:
            return new IntegerObj(+node.value!);

        case node instanceof BooleanLiteral:
            return nativeBooleanToBooleanObject(node.value!);

        case node instanceof StringLiteral:
            return new StringObj(node.value!);

        case node instanceof PrefixExpression: {
            const right = evaluator(node.right!, env);
            if (isError(right)) {
                return right;
            }

            return evalPrefixExpression(node.operator, right);
        }

        case node instanceof InfixExpression: {
            const left = evaluator(node.left!, env);
            if (isError(left)) {
                return left;
            }

            const right = evaluator(node.right!, env);
            if (isError(right)) {
                return right;
            }

            return evalInfixExpression(node.operator, left, right);
        }

        case node instanceof IfExpression:
            return evalIfExpression(node, env);

        case node instanceof Identifier:
            return evalIdentifier(node, env);

        case node instanceof FunctionLiteral:
            const params = node.parameters;
            const body = node.body;
            return new FunctionObj({ params, env, body });

        case node instanceof CallExpression:
            const func = evaluator(node.function!, env);
            if (isError(func)) {
                return func;
            }

            const args = evalExpressions(node.arguments!, env);
            if (args.length === 1 && isError(args[0])) {
                return args[0];
            }

            return applyFunction(func!, args);

        case node instanceof ArrayLiteral:
            const elements = evalExpressions(node.elements!, env);

            if (elements.length === 1 && isError(elements[0])) {
                return elements[0];
            }

            return new ArrayObj(elements);

        case node instanceof IndexExpression:
            const left = evaluator(node.left!, env);
            if (isError(left)) {
                return left;
            }

            const index = evaluator(node.index!, env);
            if (isError(index)) {
                return index;
            }

            return evalIndexExpression(left!, index!);

        case node instanceof HashLiteral:
            return evalHashLiteral(node, env);
    }

    return undefined;
}

function evalProgram(
    stmts: Statement[],
    env: Environment,
): MObject | undefined {
    let result: MObject | undefined = undefined;

    for (const statement of stmts) {
        result = evaluator(statement, env);

        switch (true) {
            case result instanceof ReturnValueObj:
                return result.value;
            case result instanceof ErrorObj:
                return result;
        }
    }

    return result;
}

function evalPrefixExpression(operator?: string, right?: MObject): MObject {
    switch (operator) {
        case "!":
            return evalBangOperatorExpression(right);
        case "-":
            return evalMinusPrefixOperatorExpression(right);
        default:
            return newError(`unknown operator: ${operator} ${right?.type()}`);
    }
}

function evalInfixExpression(
    operator?: string,
    left?: MObject,
    right?: MObject,
): MObject {
    if (left instanceof IntegerObj && right instanceof IntegerObj) {
        return evalIntegerInfixExpression(operator, left, right);
    }

    if (operator === "==") {
        return nativeBooleanToBooleanObject(left == right);
    }

    if (operator === "!=") {
        return nativeBooleanToBooleanObject(left != right);
    }

    if (left?.type() !== right?.type()) {
        return newError(
            `type mismatch: ${left?.type()} ${operator} ${right?.type()}`,
        );
    }

    if (left instanceof StringObj && right instanceof StringObj) {
        return evalStringInfixExpression(operator!, left, right);
    }

    return newError(
        `unknown operator: ${left?.type()} ${operator} ${right?.type()}`,
    );
}

function evalIntegerInfixExpression(
    operator?: string,
    left?: IntegerObj,
    right?: IntegerObj,
): MObject {
    const leftVal = left?.value;
    const rightVal = right?.value;

    if (!leftVal) {
        return newError(`missing leftVal ${leftVal}`);
    }

    if (!rightVal) {
        return newError(`missing rightVal ${rightVal}`);
    }

    switch (operator) {
        case "+":
            return new IntegerObj(leftVal + rightVal);
        case "-":
            return new IntegerObj(leftVal - rightVal);
        case "*":
            return new IntegerObj(leftVal * rightVal);
        case "/":
            return new IntegerObj(leftVal / rightVal);
        case "<":
            return nativeBooleanToBooleanObject(leftVal < rightVal);
        case ">":
            return nativeBooleanToBooleanObject(leftVal > rightVal);
        case "==":
            return nativeBooleanToBooleanObject(leftVal == rightVal);
        case "!=":
            return nativeBooleanToBooleanObject(leftVal != rightVal);
        default:
            return newError(
                `unknown operator: ${left.type()} ${operator}, ${right.type()}`,
            );
    }
}

function evalStringInfixExpression(
    operator: string,
    left: StringObj,
    right: StringObj,
): MObject {
    if (operator !== "+") {
        return newError(
            `unknown operator: ${left.type()} ${operator} ${right.type()}`,
        );
    }

    const leftVal = left.value;
    const rightVal = right.value;
    return new StringObj(leftVal + rightVal);
}

function evalIndexExpression(left: MObject, index: MObject): MObject {
    if (left instanceof ArrayObj && index instanceof IntegerObj) {
        return evalArrayIndexExpression(left, index);
    }

    if (left instanceof HashObj) {
        return evalHashIndexExpression(left, index);
    }

    return newError(`index operator not supported: ${left.type()}`);
}

function evalArrayIndexExpression(
    arrayObj: ArrayObj,
    index: IntegerObj,
): MObject {
    const idx = index.value;
    const max = arrayObj.elements.length - 1;

    if (idx < 0 || idx > max) {
        return NULL;
    }

    return arrayObj.elements[idx];
}

function evalHashLiteral(
    node: HashLiteral,
    env: Environment,
): MObject | undefined {
    const pairs = new Map<HashKey, HashPair>();

    for (const [keyNode, valueNode] of node.pairs ?? []) {
        const key = evaluator(keyNode, env);
        if (isError(key)) {
            return key;
        }

        if (!(key instanceof Hashable)) {
            return newError(`unusable as hash key: ${key?.type()}`);
        }

        const value = evaluator(valueNode, env);
        if (isError(value)) {
            return value;
        }

        const hashed = key.hashKey();
        pairs.set(hashed, { key, value: value! });
    }

    return new HashObj(pairs);
}

function evalHashIndexExpression(hash: HashObj, index: MObject): MObject {
    if (!(index instanceof Hashable)) {
        return newError(`unusable as hash key: ${index.type()}`);
    }

    const pair = hash.pairs.get(index.hashKey());

    if (!pair) {
        return NULL;
    }

    return pair.value;
}

function evalIfExpression(
    ifExpress: IfExpression,
    env: Environment,
): MObject | undefined {
    const condition = evaluator(ifExpress.condition!, env);

    if (isError(condition)) {
        return condition;
    }

    if (isTruthy(condition)) {
        return evaluator(ifExpress.consequence!, env);
    } else if (ifExpress.alternative) {
        return evaluator(ifExpress.alternative!, env);
    } else {
        return NULL;
    }
}

function evalIdentifier(node: Identifier, env: Environment): MObject {
    const value = env.get(node.value);
    if (value) {
        return value;
    }

    const builtin = builtins[node.value!];
    if (builtin) {
        return builtin;
    }

    return newError(`identifier not found: ${node.value}`);
}

function evalBlockStatement(
    block: BlockStatement,
    env: Environment,
): MObject | undefined {
    let result: MObject | undefined = undefined;

    for (const statement of block.statements ?? []) {
        result = evaluator(statement, env);

        if (result) {
            const rt = result.type();
            if (
                rt === ObjectType.RETURN_VALUE_OBJ ||
                rt === ObjectType.ERROR_OBJ
            ) {
                return result;
            }
        }
    }

    return result;
}

function evalBangOperatorExpression(right?: MObject): MObject {
    switch (right) {
        case TRUE:
            return FALSE;
        case FALSE:
            return TRUE;
        case NULL:
            return TRUE;
        default:
            return FALSE;
    }
}

function evalMinusPrefixOperatorExpression(right?: MObject): MObject {
    if (
        right?.type() !== ObjectType.INTEGER_OBJ ||
        !(right instanceof IntegerObj)
    ) {
        return newError(`unknown operator: -${right?.type()}`);
    }

    const value = right.value;
    return new IntegerObj(-value);
}

function evalExpressions(exps: Expression[], env: Environment): MObject[] {
    const result: MObject[] = [];

    for (const exp of exps) {
        const evaluated = evaluator(exp, env);
        if (isError(evaluated)) {
            return [evaluated!];
        }

        result.push(evaluated!);
    }

    return result;
}

function applyFunction(func: MObject, args: MObject[]): MObject {
    if (func instanceof FunctionObj) {
        const extendedEnv = extendedFunctionEnv(func, args);
        const evaluated = evaluator(func.body!, extendedEnv);
        return unwrapReturnValue(evaluated!);
    }

    if (func instanceof BuiltinObj) {
        return func.fn(...args);
    }

    return newError(`not a function ${func.type()}`);
}

function extendedFunctionEnv(func: FunctionObj, args: MObject[]): Environment {
    const env = newEnclosedEnvironment(func.env);

    for (const [index, param] of func.params?.entries() ?? []) {
        env.set(param.value!, args[index]);
    }

    return env;
}

function unwrapReturnValue(obj: MObject): MObject {
    if (obj instanceof ReturnValueObj) {
        return obj.value;
    }

    return obj;
}

function isTruthy(obj?: MObject): boolean {
    switch (obj) {
        case NULL:
            return false;
        case TRUE:
            return true;
        case FALSE:
            return false;
        default:
            return true;
    }
}

function nativeBooleanToBooleanObject(input: boolean): BooleanObj {
    if (input) {
        return TRUE;
    } else {
        return FALSE;
    }
}

export function newError(msg: string) {
    return new ErrorObj(msg);
}

function isError(obj?: MObject): boolean {
    if (obj) {
        return obj.type() === ObjectType.ERROR_OBJ;
    }

    return false;
}
