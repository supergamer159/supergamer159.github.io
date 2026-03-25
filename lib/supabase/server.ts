import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv, hasSupabaseBrowserEnv, hasSupabaseServiceEnv } from "@/lib/supabase/env";

export async function getSupabaseServerClient() {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const store = await cookies();
  const env = getSupabasePublicEnv();
  return createServerClient(env.url!, env.anonKey!, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: Parameters<typeof store.set>[2]) {
        store.set(name, value, options);
      },
      remove(name: string, options: Parameters<typeof store.set>[2]) {
        store.set(name, "", {
          ...options,
          maxAge: 0,
        });
      },
    },
  });
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
