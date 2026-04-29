export type PicklistTeam = {
  teamNumber: number;
  nameShort: string;
  primaryColor?: string;
  epaMean?: number;
  city?: string;
  stateProv?: string;
  country?: string;
};

export type PicklistColumn = {
  id: string;
  name: string;
  teams: PicklistTeam[];
};
