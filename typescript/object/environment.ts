import type { MObject } from "./object.js";

export function newEnclosedEnvironment(outer: Environment): Environment {
    const env = newEnvironment();
    env.outer = outer;
    return env;
}

export function newEnvironment(): Environment {
    const store = new Map();
    return new Environment(store);
}

export class Environment {
    private store: Map<string, MObject>;
    public outer?: Environment | null;

    constructor(store: Map<string, MObject>, outer?: Environment) {
        this.store = store;
        this.outer = outer;
    }

    public get(name: string): MObject | undefined {
        let obj = this.store.get(name);

        if (!obj && this.outer) {
            obj = this.outer.get(name);
        }

        return obj;
    }

    public set(name: string, value: MObject): MObject {
        this.store.set(name, value);
        return value;
    }
}
