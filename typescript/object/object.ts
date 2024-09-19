import { createHash } from "node:crypto";
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
    FOR_OBJ = "FOR",
}

export interface MObject {
    type(): ObjectType;
    inspect(): string;
}

export type HashKey = number | string;

export abstract class Hashable {
    public hashKey(): HashKey {
        return "";
    }
}

export class IntegerObj extends Hashable implements MObject {
    constructor(public value: number) {
        super();
    }

    public inspect(): string {
        return this.value.toString();
    }

    public type(): ObjectType {
        return ObjectType.INTEGER_OBJ;
    }

    public hashKey(): HashKey {
        return this.value;
    }
}

export class BooleanObj extends Hashable implements MObject {
    constructor(public value: boolean) {
        super();
    }

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

        return value;
    }
}

export class StringObj extends Hashable implements MObject {
    constructor(public value: string) {
        super();
    }

    public type(): ObjectType {
        return ObjectType.STRING_OBJ;
    }

    public inspect(): string {
        return this.value;
    }

    public hashKey(): HashKey {
        const hash = createHash("sha256").update(this.value).digest("hex");

        return hash;
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

export class ForObj implements MObject {
    constructor() {}

    public type(): ObjectType {
        return ObjectType.FOR_OBJ;
    }

    public inspect(): string {
        const out: string[] = [];

        out.push("(");
        out.push(")");

        return out.join("");
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

export class ArrayObj implements MObject {
    constructor(public elements: MObject[]) {}

    public type(): ObjectType {
        return ObjectType.ARRAY_OBJ;
    }

    public inspect(): string {
        const out: string[] = [];
        const elements: string[] = [];

        for (const elem of this.elements) {
            elements.push(elem.inspect());
        }

        out.push("[");
        out.push(elements.join(", "));
        out.push("]");
        return out.join("");
    }
}

export type HashPair = {
    key: MObject;
    value: MObject;
};
export class HashObj implements MObject {
    constructor(public pairs: Map<HashKey, HashPair>) {}

    public type(): ObjectType {
        return ObjectType.HASH_OBJ;
    }

    public inspect(): string {
        const out: string[] = [];
        const pairs: string[] = [];

        this.pairs.forEach((pair) =>
            pairs.push(`${pair.key.inspect()}: ${pair.value.inspect()}`),
        );

        out.push("{");
        out.push(pairs.join(", "));
        out.push("}");
        return out.join("");
    }
}

type BuiltinFunction = (...args: MObject[]) => MObject;
export class BuiltinObj implements MObject {
    constructor(public fn: BuiltinFunction) {}

    public type(): ObjectType {
        return ObjectType.BUILTIN_OBJ;
    }

    public inspect(): string {
        return "builtin function";
    }
}
