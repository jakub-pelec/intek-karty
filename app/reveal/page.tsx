import { RevealStage } from "@/components/reveal-stage";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-env";

export default function RevealPage() {
  return (
    <RevealStage
      supabaseUrl={getSupabaseUrl()}
      supabaseAnonKey={getSupabaseAnonKey()}
    />
  );
}
