/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { initTRPC } from '@trpc/server';
/**
 * EXPERIMENTAL: Don't use unless you're willing to help figure out the API, and whether it should even exist.
 * See description in https://github.com/mmkal/trpc-cli/pull/153
 */
export const proxify = (router, getClient) => {
    const trpc = initTRPC.create();
    const outputRouterRecord = {};
    const entries = Object.entries(router._def.procedures);
    for (const [procedurePath, oldProc] of entries) {
        const parts = procedurePath.split('.');
        let currentRouter = outputRouterRecord;
        for (const part of parts.slice(0, -1)) {
            currentRouter = currentRouter[part] ||= {};
        }
        let newProc = trpc.procedure;
        const inputs = oldProc._def.inputs;
        inputs?.forEach(input => {
            newProc = newProc.input(input);
        });
        if (oldProc._def.type === 'query') {
            newProc = newProc.query(async ({ input }) => {
                const client = await getClient(procedurePath);
                return client[procedurePath].query(input);
            });
        }
        else if (oldProc._def.type === 'mutation') {
            newProc = newProc.mutation(async ({ input }) => {
                const client = await getClient(procedurePath);
                return client[procedurePath].mutate(input);
            });
        }
        currentRouter[parts[parts.length - 1]] = newProc;
    }
    return trpc.router(outputRouterRecord);
};
