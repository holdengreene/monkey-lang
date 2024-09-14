import { expect, it } from "vitest";
import { BooleanObj, IntegerObj, StringObj } from "./object.js";

it("should create a hash key for strings", () => {
    const hello1 = new StringObj("Hello World");
    const hello2 = new StringObj("Hello World");
    const diff1 = new StringObj("My name is johnny");
    const diff2 = new StringObj("My name is johnny");

    expect(hello1.hashKey()).toStrictEqual(hello2.hashKey());
    expect(diff1.hashKey()).toStrictEqual(diff2.hashKey());
    expect(hello1.hashKey()).not.toStrictEqual(diff1.hashKey());
});

it("should create a hash key for booleans", () => {
    const true1 = new BooleanObj(true);
    const true2 = new BooleanObj(true);
    const false1 = new BooleanObj(false);
    const false2 = new BooleanObj(false);

    expect(true1.hashKey()).toStrictEqual(true2.hashKey());
    expect(false1.hashKey()).toStrictEqual(false2.hashKey());
    expect(true1.hashKey()).not.toStrictEqual(false1.hashKey());
});

it("should create a hash key for integers", () => {
    const one1 = new IntegerObj(1);
    const one2 = new IntegerObj(1);
    const two1 = new IntegerObj(2);
    const two2 = new IntegerObj(2);

    expect(one1.hashKey()).toStrictEqual(one2.hashKey());
    expect(two1.hashKey()).toStrictEqual(two2.hashKey());
    expect(one1.hashKey()).not.toStrictEqual(two1.hashKey());
});
