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

export class Integer implements MObject {
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
