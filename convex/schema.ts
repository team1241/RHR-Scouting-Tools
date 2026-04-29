import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
  metadata: defineTable({
    userName: v.string(),
    eventCode: v.string(),
    matchNumber: v.string(),
    teamNumber: v.number(),
    videoUrl: v.string(),
    bps: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),
  cycles: defineTable({
    metadataId: v.id("metadata"),
    cycleNumber: v.number(),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    numberOfBalls: v.number(),
    bps: v.number(),
    cycleType: v.union(v.literal('feeding'), v.literal('shooting')),
    createdAt: v.string(),
    updatedAt: v.string()
  }).index("by_metadata", ["metadataId"]),
  picklists: defineTable({
    name: v.string(),
    ownerSubject: v.optional(v.string()),
    eventCode: v.optional(v.string()),
    eventTeams: v.optional(v.array(
      v.object({
        teamNumber: v.number(),
        nameShort: v.string(),
        primaryColor: v.optional(v.string()),
        epaMean: v.optional(v.number()),
        city: v.optional(v.string()),
        stateProv: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    )),
    columns: v.optional(v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        teams: v.array(
          v.object({
            teamNumber: v.number(),
            nameShort: v.string(),
            primaryColor: v.optional(v.string()),
            epaMean: v.optional(v.number()),
            city: v.optional(v.string()),
            stateProv: v.optional(v.string()),
            country: v.optional(v.string()),
          })
        ),
      })
    )),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_owner", ["ownerSubject"])
    .index("by_owner_and_updated", ["ownerSubject", "updatedAt"]),
})
