import {
    BlockStatement,
    BooleanLiteral,
    CallExpression,
    Expression,
    ExpressionStatement,
    FunctionLiteral,
    IfExpression,
    InfixExpression,
    IntegerLiteral,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
    type ASTNode,
} from "../ast/ast.js";
import {
    newEnclosedEnvironment,
    type Environment,
} from "../object/environment.js";
import {
    BooleanObj,
    ErrorObj,
    FunctionObj,
    IntegerObj,
    NullObj,
    ObjectType,
    ReturnValueObj,
    type MObject,
} from "../object/object.js";

export const NULL = new NullObj();
const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);

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

        // Expressions
        case node instanceof IntegerLiteral:
            return new IntegerObj(+node.value!);
        case node instanceof BooleanLiteral:
            return nativeBooleanToBooleanObject(node.value!);
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
        case node instanceof BlockStatement:
            return evalBlockStatement(node, env);
        case node instanceof IfExpression:
            return evalIfExpression(node, env);
        case node instanceof ReturnStatement:
            const val = evaluator(node.returnValue!, env);
            if (isError(val)) {
                return val;
            }
            return new ReturnValueObj(val!);
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
    if (
        left?.type() === ObjectType.INTEGER_OBJ &&
        left?.type() === ObjectType.INTEGER_OBJ
    ) {
        return evalIntegerInfixExpression(
            operator,
            left as IntegerObj,
            right as IntegerObj,
        );
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

    if (
        left?.type() === ObjectType.STRING_OBJ &&
        right?.type() === ObjectType.STRING_OBJ
    ) {
        return;
    }

    return newError(
        `unknown operator ${left?.type()} ${operator} ${right?.type()}`,
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
                `unknown operator ${left.type()} ${operator}, ${right.type()}`,
            );
    }
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
        return newError(`unknown operator - ${right?.type()}`);
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

function newError(msg: string) {
    return new ErrorObj(msg);
}

function isError(obj?: MObject): boolean {
    if (obj) {
        return obj.type() === ObjectType.ERROR_OBJ;
    }

    return false;
}
