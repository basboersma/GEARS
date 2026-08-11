/* eslint-disable @typescript-eslint/no-explicit-any */
export const isTrpc11Procedure = (procedure) => {
    return 'type' in procedure._def && typeof procedure._def.type === 'string';
};
export const isTrpc11Router = (router) => {
    if (isOrpcRouter(router))
        return false;
    const procedure = Object.values(router._def.procedures)[0];
    return Boolean(procedure && isTrpc11Procedure(procedure));
};
// no way to actually check a router, because they are just records of procedures and sub-routers.
// so recursively check values for procedures and sub-routers
export const isOrpcRouter = (router) => {
    const values = [];
    for (const v of Object.values(router)) {
        if (typeof v === 'function')
            return false;
        values.push(v);
    }
    return values.every(v => isOrpcProcedure(v) || isOrpcRouter(v));
};
export const isOrpcProcedure = (procedure) => {
    return typeof procedure === 'object' && '~orpc' in procedure && typeof procedure['~orpc'] === 'object';
};
