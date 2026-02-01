'use server'
import { supabase } from "@/lib/db/supabase";

export async function callMatchCard() {
  const { data, error } = await supabase.rpc('team_match_summary_json', { p_event_id: 8 });

  if (error) {
    console.error('Error invoking RPC:', error);
  }
  return data
}