"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | undefined;

function getSupabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return supabaseUrl;
}

function getSupabaseAnonKey() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }

  return supabaseAnonKey;
}

export function getBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }

  return browserClient;
}