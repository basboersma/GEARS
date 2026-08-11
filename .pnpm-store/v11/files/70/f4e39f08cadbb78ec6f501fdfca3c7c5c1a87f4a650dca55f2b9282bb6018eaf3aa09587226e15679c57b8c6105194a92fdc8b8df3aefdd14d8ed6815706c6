import type { ZodObjectDef } from "zod";
import type { JsonSchema7Type } from "../parseTypes.js";
import type { Refs } from "../Refs.js";
export type JsonSchema7ObjectType = {
    type: "object";
    properties: Record<string, JsonSchema7Type>;
    additionalProperties?: boolean | JsonSchema7Type;
    required?: string[];
};
export declare function parseObjectDef(def: ZodObjectDef, refs: Refs): JsonSchema7ObjectType;
