"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabaseBrowserEnv } from "@/lib/supabase/env";

let singleton: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }
  if (!singleton) {
    const env = getSupabasePublicEnv();
    singleton = createBrowserClient(env.url!, env.anonKey!);
  }
  return singleton;
}
