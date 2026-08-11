import type { ZodTupleDef, ZodTupleItems, ZodTypeAny } from "zod";
import type { JsonSchema7Type } from "../parseTypes.js";
import type { Refs } from "../Refs.js";
export type JsonSchema7TupleType = {
    type: "array";
    minItems: number;
    items: JsonSchema7Type[];
} & ({
    maxItems: number;
} | {
    additionalItems?: JsonSchema7Type;
});
export declare function parseTupleDef(def: ZodTupleDef<ZodTupleItems | [], ZodTypeAny | null>, refs: Refs): JsonSchema7TupleType;
