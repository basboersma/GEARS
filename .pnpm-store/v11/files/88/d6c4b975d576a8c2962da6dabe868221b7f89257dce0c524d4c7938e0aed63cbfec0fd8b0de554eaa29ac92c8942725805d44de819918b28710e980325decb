import type { ZodNullableDef } from "zod";
import type { JsonSchema7Type } from "../parseTypes.js";
import type { Refs } from "../Refs.js";
import type { JsonSchema7NullType } from "./null.js";
export type JsonSchema7NullableType = {
    anyOf: [JsonSchema7Type, JsonSchema7NullType];
} | {
    type: [string, "null"];
};
export declare function parseNullableDef(def: ZodNullableDef, refs: Refs): JsonSchema7NullableType | undefined;
