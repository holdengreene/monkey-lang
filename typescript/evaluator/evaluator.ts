import {
    ExpressionStatement,
    IntegerLiteral,
    PrefixExpression,
    Program,
    Statement,
    type ASTNode,
} from "../ast/ast.js";
import type { Environment } from "../object/environment.js";
import {
    BooleanObj,
    ErrorObj,
    IntegerObj,
    NullObj,
    ObjectType,
    type MObject,
} from "../object/object.js";

const NULL = new NullObj();
const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);

export function evaluator(
    node: ASTNode,
    env: Environment,
): MObject | undefined {
    switch (true) {
        // Statements
        case node instanceof Program && node.statements.length > 0:
            return evalProgram(node.statements, env);
        case node instanceof ExpressionStatement:
            return evaluator(node.expression!, env);

        // Expressions
        case node instanceof IntegerLiteral:
            return new IntegerObj(+node.value!);
        case node instanceof PrefixExpression:
            const right = evaluator(node.right!, env);
            if (isError(right)) {
                return right;
            }

            return evalPrefixExpression(node.operator, right);
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

function newError(msg: string) {
    return new ErrorObj(msg);
}

function isError(obj?: MObject): boolean {
    if (obj) {
        return obj.type() === ObjectType.ERROR_OBJ;
    }

    return false;
}
