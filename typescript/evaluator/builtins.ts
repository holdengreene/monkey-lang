import {
    ArrayObj,
    BuiltinObj,
    IntegerObj,
    StringObj,
    type MObject,
} from "../object/object.js";
import { newError, NULL } from "./evaluator.js";

export const builtins: Record<string, BuiltinObj> = {
    len: new BuiltinObj(lenFn),
    first: new BuiltinObj(firstFn),
    last: new BuiltinObj(lastFn),
    rest: new BuiltinObj(restFn),
    push: new BuiltinObj(pushFn),
    puts: new BuiltinObj(putsFn),
};

function lenFn(...args: MObject[]): MObject {
    if (args.length !== 1) {
        return newError(
            `wrong number of arguments. got=${args.length}, want=1`,
        );
    }

    const arg = args[0];

    switch (true) {
        case arg instanceof ArrayObj:
            return new IntegerObj(arg.elements.length);
        case arg instanceof StringObj:
            return new IntegerObj(arg.value.length);
        default:
            return newError(
                `argument to 'len' not supported, got ${arg.type()}`,
            );
    }
}

function firstFn(...args: MObject[]): MObject {
    if (args.length !== 1) {
        return newError(
            `wrong number of arguments. got=${args.length}, want=1`,
        );
    }

    const arrayObj = args[0];
    if (!(arrayObj instanceof ArrayObj)) {
        return newError(
            `argument to 'first' must be ARRAY, got ${arrayObj.type()}`,
        );
    }

    if (arrayObj.elements.length > 0) {
        return arrayObj.elements[0];
    }

    return NULL;
}

function lastFn(...args: MObject[]): MObject {
    if (args.length !== 1) {
        return newError(
            `wrong number of arguments. got=${args.length}, want=1`,
        );
    }

    const arrayObj = args[0];
    if (!(arrayObj instanceof ArrayObj)) {
        return newError(
            `argument to 'last' must be ARRAY, got ${arrayObj.type()}`,
        );
    }

    if (arrayObj.elements.length > 0) {
        return arrayObj.elements.at(-1)!;
    }

    return NULL;
}

function restFn(...args: MObject[]): MObject {
    if (args.length !== 1) {
        return newError(
            `wrong number of arguments. got=${args.length}, want=1`,
        );
    }

    const arrayObj = args[0];
    if (!(arrayObj instanceof ArrayObj)) {
        return newError(
            `argument to 'rest' must be ARRAY, got ${arrayObj.type()}`,
        );
    }

    if (arrayObj.elements.length > 0) {
        const newArray = arrayObj.elements.slice(1);
        return new ArrayObj(newArray);
    }

    return NULL;
}

function pushFn(...args: MObject[]): MObject {
    if (args.length !== 2) {
        return newError(
            `wrong number of arguments. got=${args.length}, want=2`,
        );
    }

    const arrayObj = args[0];
    if (!(arrayObj instanceof ArrayObj)) {
        return newError(
            `argument to 'push' must be ARRAY, got ${arrayObj.type()}`,
        );
    }

    arrayObj.elements.push(args[1]);

    return new ArrayObj(arrayObj.elements);
}

function putsFn(...args: MObject[]): MObject {
    for (const arg of args) {
        console.log(arg.inspect());
    }

    return NULL;
}
