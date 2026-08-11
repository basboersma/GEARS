import type { ZodTypeDef } from "zod";
import { type Options, type Targets } from "./Options.js";
import type { JsonSchema7Type } from "./parseTypes.js";
export type Refs = {
    seen: Map<ZodTypeDef, Seen>;
    currentPath: string[];
    propertyPath: string[] | undefined;
    flags: {
        hasReferencedOpenAiAnyType: boolean;
    };
} & Options<Targets>;
export type Seen = {
    def: ZodTypeDef;
    path: string[];
    jsonSchema: JsonSchema7Type | undefined;
};
export declare const getRefs: (options?: string | Partial<Options<Targets>>) => Refs;
