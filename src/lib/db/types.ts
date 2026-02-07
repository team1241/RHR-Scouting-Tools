
export interface MatchCardData {
  team: number,
  matches: number,

  avgShootingSeconds: number,
  maxShootingSeconds: number,
  avgFeedingSeconds: number,

  trench: boolean,
  bump: boolean,

  halfFieldFromNeutral: boolean,
  halfFieldFromOpponent: boolean,
  fullField: boolean

  L3Climbs: number,
  L2Climbs: number,
  L1Climbs: number,
  autoClimbs: number

  avgAutoShootingSeconds: number;
  maxAutoShootingSeconds: number;
  avgAutoFeedingSeconds: number;
  avgAutoAttemptedSeconds: number;
  autoShootingAccuracy: number;

  avgTeleopShootingSeconds: number;
  maxTeleopShootingSeconds: number;
  teleopShootingAccuracy: number;

  autoTrench: boolean,
  autoBump: boolean,
  autoFeed: boolean

}

export interface Event {
  id: number,
  seasonId: number,
  name: string,
  venue: string,
  eventType: string,
  eventKey: string,
  districtKey: string,
  startDate: string,
  endDate: string,
  createdAt: string,
  updatedAt: string
}

export interface EventResponse {
  events: Event[],
  year: number
}

export interface FieldImage {
  id: number,
  seasonId: number,
  imageUrls: string[],
  teamNumber: number
}

export interface TeamInMatch {
  colour: string,
  driverStation: number,
  team: {
    id: number,
    number: number,
    name: string
  }
}

export interface TeamsInMatchResponse {
  eventId: number,
  matchNumber: string,
  redAlliance: TeamInMatch[],
  blueAlliance: TeamInMatch[]
}