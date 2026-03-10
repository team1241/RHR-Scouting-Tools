import { FieldImage } from "@/lib/db/types";
import { QueryKeys } from "@/lib/queries/query-keys"
import { fetchScoutingApi } from "@/lib/scouting-api";
import { useQuery } from "@tanstack/react-query"


interface UseTeamImagesForMatchProps {
  teamNumbers?: number[]
  enabled?: boolean
}

export const useTeamImages = ({
  teamNumbers,
  enabled = true,
}: UseTeamImagesForMatchProps) => {
  return useQuery({
    queryKey: [QueryKeys.TeamImagesForMatch, teamNumbers],
    queryFn: async () => {
      const params = new URLSearchParams()
      teamNumbers?.map(team => params.append("teamNumbers", team.toString()))
      const events = await fetchScoutingApi<FieldImage[]>('/robot-images?' + params.toString())

      return events
    },
    enabled: enabled && !!teamNumbers && teamNumbers.length > 0,
    retry: false
  })
}
