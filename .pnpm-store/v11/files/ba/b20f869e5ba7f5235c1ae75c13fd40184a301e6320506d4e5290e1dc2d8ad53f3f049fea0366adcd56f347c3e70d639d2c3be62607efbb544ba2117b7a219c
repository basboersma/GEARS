import { JSONSchema7 } from 'json-schema';
export declare const flattenedProperties: (sch: JSONSchema7) => Record<string, JSONSchema7>;
/** For a union type, returns a list of pairs of properties which *shouldn't* be used together (because they don't appear in the same type variant) */
export declare const incompatiblePropertyPairs: (sch: JSONSchema7) => Array<[string, string]>;
/**
 * Tries fairly hard to build a roughly human-readable description of a json-schema type.
 * A few common properties are given special treatment, most others are just stringified and output in `key: value` format.
 */
export declare const getDescription: (v: JSONSchema7, depth?: number) => string;
export declare const getSchemaTypes: (propertyValue: JSONSchema7) => Array<"string" | "boolean" | "number" | "integer" | (string & {})>;
/** Returns a list of all allowed subschemas. If the schema is not a union, returns a list with a single item. */
export declare const getAllowedSchemas: (schema: JSONSchema7) => JSONSchema7[];
export declare const getEnumChoices: (propertyValue: JSONSchema7) => {
    readonly type: "string_enum";
    readonly choices: string[];
} | {
    readonly type: "number_enum";
    readonly choices: number[];
} | null;
