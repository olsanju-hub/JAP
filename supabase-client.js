const SUPABASE_CLIENT_URL = "https://esm.sh/@supabase/supabase-js@2";

let supabaseClientPromise = null;

export async function loadJapConfig() {
  const inlineConfig = window.JAP_SUPABASE_CONFIG || window.JAP_CONFIG;
  if (inlineConfig?.SUPABASE_URL && inlineConfig?.SUPABASE_ANON_KEY) {
    return inlineConfig;
  }

  try {
    const response = await fetch("./config.js", { method: "HEAD", cache: "no-store" });
    if (!response.ok) return null;
    const module = await import("./config.js");
    return module.default || window.JAP_SUPABASE_CONFIG || window.JAP_CONFIG || null;
  } catch {
    return null;
  }
}

export function hasSupabaseConfig(config) {
  return Boolean(
    config?.SUPABASE_URL &&
      config?.SUPABASE_ANON_KEY &&
      !config.SUPABASE_URL.includes("TU-PROYECTO") &&
      !config.SUPABASE_ANON_KEY.includes("TU_SUPABASE")
  );
}

export async function getSupabaseClient() {
  if (supabaseClientPromise) return supabaseClientPromise;

  supabaseClientPromise = (async () => {
    const config = await loadJapConfig();
    if (!hasSupabaseConfig(config)) return null;

    const { createClient } = await import(SUPABASE_CLIENT_URL);
    return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  })();

  return supabaseClientPromise;
}
