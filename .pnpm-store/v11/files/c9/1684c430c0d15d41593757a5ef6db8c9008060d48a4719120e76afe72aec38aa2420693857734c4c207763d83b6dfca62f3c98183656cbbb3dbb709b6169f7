import * as _trpc_server from '@trpc/server';
import { TrpcCliMeta } from 'trpc-cli';

declare const router: _trpc_server.TRPCBuiltRouter<{
    ctx: object;
    meta: TrpcCliMeta;
    errorShape: _trpc_server.TRPCDefaultErrorShape;
    transformer: false;
}, _trpc_server.TRPCDecorateCreateRouterOptions<{
    init: _trpc_server.TRPCMutationProcedure<{
        input: {
            pm?: "npm" | "yarn" | "pnpm" | "bun" | "deno" | undefined;
            linter?: "biome" | "eslint" | "oxlint" | undefined;
            editors?: string[] | undefined;
            agents?: string[] | undefined;
            hooks?: string[] | undefined;
            frameworks?: ("react" | "next" | "solid" | "vue" | "svelte" | "qwik" | "remix" | "angular" | "astro")[] | undefined;
            integrations?: ("husky" | "lefthook" | "lint-staged" | "pre-commit")[] | undefined;
            migrate?: ("eslint" | "prettier")[] | undefined;
            "type-aware"?: boolean | undefined;
            skipInstall?: boolean | undefined;
            quiet?: boolean | undefined;
        };
        output: void;
        meta: TrpcCliMeta;
    }>;
    check: _trpc_server.TRPCQueryProcedure<{
        input: [string[] | undefined, {
            "diagnostic-level"?: "info" | "warn" | "error" | undefined;
            linter?: "biome" | "eslint" | "oxlint" | undefined;
            "type-aware"?: boolean | undefined;
            "type-check"?: boolean | undefined;
            "no-error-on-unmatched-pattern"?: boolean | undefined;
            "error-on-warnings"?: boolean | undefined;
        }] | undefined;
        output: void;
        meta: TrpcCliMeta;
    }>;
    fix: _trpc_server.TRPCMutationProcedure<{
        input: [string[] | undefined, {
            unsafe?: boolean | undefined;
            linter?: "biome" | "eslint" | "oxlint" | undefined;
            "type-aware"?: boolean | undefined;
            "type-check"?: boolean | undefined;
            "error-on-warnings"?: boolean | undefined;
        }] | undefined;
        output: void;
        meta: TrpcCliMeta;
    }>;
    doctor: _trpc_server.TRPCQueryProcedure<{
        input: void;
        output: void;
        meta: TrpcCliMeta;
    }>;
}>>;

export { router };
