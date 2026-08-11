export const looksLikeStandardSchemaFailure = (error) => {
    return !!error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues);
};
export const looksLikeStandardSchema = (thing) => {
    return !!thing && typeof thing === 'object' && '~standard' in thing && typeof thing['~standard'] === 'object';
};
