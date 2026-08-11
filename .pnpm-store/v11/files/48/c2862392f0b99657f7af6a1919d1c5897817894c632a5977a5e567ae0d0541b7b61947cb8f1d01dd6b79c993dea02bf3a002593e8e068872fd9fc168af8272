import type { ZodArrayDef } from "zod";
import { type ErrorMessages } from "../errorMessages.js";
import type { JsonSchema7Type } from "../parseTypes.js";
import type { Refs } from "../Refs.js";
export type JsonSchema7ArrayType = {
    type: "array";
    items?: JsonSchema7Type;
    minItems?: number;
    maxItems?: number;
    errorMessages?: ErrorMessages<JsonSchema7ArrayType, "items">;
};
export declare function parseArrayDef(def: ZodArrayDef, refs: Refs): JsonSchema7ArrayType;
