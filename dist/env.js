import { z } from 'zod';
export const EnvSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4173),
    WARP_DEMO_CASE: z.enum(['broken', 'fixed']).default('broken'),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_DEBUG: z.enum(['true', 'false']).default('false'),
    PRODUCT_PUBLIC_URL: z.string().url().optional(),
});
export function parseEnv(raw = process.env) {
    const result = EnvSchema.safeParse(raw);
    if (!result.success) {
        const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
        throw new Error(`[env] Invalid startup config:\n${lines.join('\n')}`);
    }
    return result.data;
}
