import { useQueryStates } from "nuqs"
import { matchCardSearchParams, urlKeys } from "@/app/match-card/search-params"

export const useMatchCardParams = () => {
  return useQueryStates(matchCardSearchParams, { urlKeys, shallow: false })
}