import type { ZodSetDef } from "zod";
import { type ErrorMessages } from "../errorMessages.js";
import type { JsonSchema7Type } from "../parseTypes.js";
import type { Refs } from "../Refs.js";
export type JsonSchema7SetType = {
    type: "array";
    uniqueItems: true;
    items?: JsonSchema7Type;
    minItems?: number;
    maxItems?: number;
    errorMessage?: ErrorMessages<JsonSchema7SetType>;
};
export declare function parseSetDef(def: ZodSetDef, refs: Refs): JsonSchema7SetType;
