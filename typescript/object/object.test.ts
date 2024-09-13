import { expect, it } from "vitest";
import { IntegerObj } from "./object.js";

it("should create a hash key for integers", () => {
    const one1 = new IntegerObj(1);
    const one2 = new IntegerObj(1);
    const two1 = new IntegerObj(2);
    const two2 = new IntegerObj(2);

    // expect(one1.hashKey()).not.toStrictEqual(one2.hashKey());
    // expect(two1.hashKey()).not.toStrictEqual(two2.hashKey());
    // expect(one1.hashKey()).toStrictEqual(two1.hashKey());
});
