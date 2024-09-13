import {
    ExpressionStatement,
    IntegerLiteral,
    Program,
    type Statement,
    type ASTNode,
    type ProgramStatement,
} from "../ast/ast.js";
import type { Environment } from "../object/environment.js";
import { Integer, ObjectType, type MObject } from "../object/object.js";

export function evaluator(
    node: ASTNode,
    env: Environment,
): MObject | undefined {
    switch (true) {
        // Statements
        case node instanceof Program && node.statements.length > 0:
            return evalProgram(node.statements, env);
        case node instanceof ExpressionStatement:
            return evaluator(node.expression, env);

        // Expressions
        case node instanceof IntegerLiteral:
            return new Integer(+node.value);
    }

    return undefined;
}

function evalProgram(
    stmts: ProgramStatement[],
    env: Environment,
): MObject | undefined {
    let result: MObject | undefined = undefined;

    for (const statement of stmts) {
        result = evaluator(statement, env);
        console.log("result", result);

        if (result) {
            console.log("runn this world");
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
