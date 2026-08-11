import { looksLikeStandardSchemaFailure } from './utils.js';
export const prettifyStandardSchemaError = (error) => {
    if (!looksLikeStandardSchemaFailure(error))
        return null;
    const issues = [...error.issues]
        .map(issue => {
        const path = issue.path || [];
        const primitivePathSegments = path.map(segment => {
            if (typeof segment === 'string' || typeof segment === 'number' || typeof segment === 'symbol')
                return segment;
            return segment.key;
        });
        const dotPath = toDotPath(primitivePathSegments);
        return {
            issue,
            path,
            primitivePathSegments,
            dotPath,
        };
    })
        .sort((a, b) => a.path.length - b.path.length);
    const lines = [];
    for (const { issue, dotPath } of issues) {
        let message = `✖ ${issue.message}`;
        if (dotPath)
            message += ` → at ${dotPath}`;
        lines.push(message);
    }
    return lines.join('\n');
};
export function toDotPath(path) {
    const segs = [];
    for (const seg of path) {
        if (typeof seg === 'number')
            segs.push(`[${seg}]`);
        else if (typeof seg === 'symbol')
            segs.push(`[${JSON.stringify(String(seg))}]`);
        else if (/[^\w$]/.test(seg))
            segs.push(`[${JSON.stringify(seg)}]`);
        else {
            if (segs.length)
                segs.push('.');
            segs.push(seg);
        }
    }
    return segs.join('');
}
export class StandardSchemaV1Error extends Error {
    issues;
    constructor(failure, options) {
        super('Standard Schema error - details in `issues`.', options);
        this.issues = failure.issues;
    }
}
