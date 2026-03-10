import { supabase } from "@/lib/db/supabase";

export async function callMatchCard() {
  const { data, error } = await supabase.rpc('team_match_summary_json', { p_event_id: 8 });

  if (error) {
    console.error('Error invoking RPC:', error);
  }
  return data
}

export async function getMatchCard(eventId: number, matchNumber: number) {
  const { data, error } = await supabase.rpc('get_match_card', { event_id: eventId, match_number: matchNumber })
  if (error) {
    console.error('Error invoking RPC:', error);
  }
  return data
}