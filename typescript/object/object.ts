import { BlockStatement, Identifier } from "../ast/ast.js";
import { Environment } from "./environment.js";

export enum ObjectType {
    INTEGER_OBJ = "INTEGER",
    BOOLEAN_OBJ = "BOOLEAN",
    NULL_OBJ = "NULL",
    RETURN_VALUE_OBJ = "RETURN_VALUE",
    ERROR_OBJ = "ERROR",
    FUNCTION_OBJ = "FUNCTION",
    STRING_OBJ = "STRING",
    BUILTIN_OBJ = "BUILTIN",
    ARRAY_OBJ = "ARRAY",
    HASH_OBJ = "HASH",
}

export interface MObject {
    type(): ObjectType;
    inspect(): string;
}

type HashKey = {
    oType: ObjectType;
    value: number;
};

export class IntegerObj implements MObject {
    constructor(public value: number) {}

    public inspect(): string {
        return this.value.toString();
    }

    public type(): ObjectType {
        return ObjectType.INTEGER_OBJ;
    }

    public hashKey(): HashKey {
        return { oType: this.type(), value: this.value };
    }
}

export class ErrorObj implements MObject {
    constructor(public message: string) {}

    public type(): ObjectType {
        return ObjectType.ERROR_OBJ;
    }

    public inspect(): string {
        return `Error: ${this.message}`;
    }
}

export class BooleanObj implements MObject {
    constructor(public value: boolean) {}

    public type(): ObjectType {
        return ObjectType.BOOLEAN_OBJ;
    }

    public inspect(): string {
        return `${this.value}`;
    }

    public hashKey(): HashKey {
        let value: number;

        if (this.value) {
            value = 1;
        } else {
            value = 0;
        }

        return { oType: this.type(), value };
    }
}

export class StringObj implements MObject {
    constructor(public value: string) {}

    public type(): ObjectType {
        return ObjectType.STRING_OBJ;
    }

    public inspect(): string {
        return this.value;
    }
}

export class NullObj implements MObject {
    public type(): ObjectType {
        return ObjectType.NULL_OBJ;
    }

    public inspect(): string {
        return "null";
    }
}

export class ReturnValueObj implements MObject {
    constructor(public value: MObject) {}

    public type(): ObjectType {
        return ObjectType.RETURN_VALUE_OBJ;
    }

    public inspect(): string {
        return this.value.inspect();
    }
}

type FunctionObjParams = {
    params?: Identifier[];
    body?: BlockStatement;
    env: Environment;
};
export class FunctionObj implements MObject {
    public params?: Identifier[];
    public body?: BlockStatement;
    public env: Environment;

    constructor(functionObjParams: FunctionObjParams) {
        this.params = functionObjParams.params;
        this.body = functionObjParams.body;
        this.env = functionObjParams.env;
    }

    public type(): ObjectType {
        return ObjectType.FUNCTION_OBJ;
    }

    public inspect(): string {
        const out: string[] = [];
        const params: string[] = [];

        for (const param of this.params ?? []) {
            params.push(param.string());
        }

        out.push("fn");
        out.push("(");
        out.push(params.join(", "));
        out.push(") {\n");
        out.push(this.body?.string() ?? "");
        out.push("\n");
        return out.join("");
    }
}
