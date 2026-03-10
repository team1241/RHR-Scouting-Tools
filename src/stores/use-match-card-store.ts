import { create } from "zustand";

type MatchCardState = {
  eventId: string;
  matchNumber: string;
  setMatchSelection: (selection: {
    eventId: string;
    matchNumber: string;
  }) => void;
};

export const useMatchCardStore = create<MatchCardState>((set) => ({
  eventId: "",
  matchNumber: "",
  setMatchSelection: ({ eventId, matchNumber }) => set({ eventId, matchNumber }),
}));
