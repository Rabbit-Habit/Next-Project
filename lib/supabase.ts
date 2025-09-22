import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const createSupabaseClient = () =>
    createBrowserClient(
        supabaseUrl,
        supabaseServiceKey,
    )