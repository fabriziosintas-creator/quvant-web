/**
 * Las dos variables públicas de Supabase (URL del proyecto y clave
 * publishable). Se leen con el nombre literal para que Next las incruste
 * en el navegador. La clave secreta no está acá: vive solo en admin.ts.
 *
 * Sin estas variables la web pública sigue andando; lo que necesita
 * Supabase (registro, cuenta, panel) avisa con un error claro.
 */

export type ConfigSupabase = { url: string; clavePublica: string };

export function configSupabase(): ConfigSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clavePublica) return null;
  return { url, clavePublica };
}

export function exigirConfigSupabase(): ConfigSupabase {
  const config = configSupabase();
  if (!config) {
    throw new Error(
      "Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).",
    );
  }
  return config;
}
