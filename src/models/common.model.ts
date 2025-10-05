import z from "zod";
import { SchemaOptions } from "mongoose";
import { zId } from "@zodyac/zod-mongoose";

export const zModel = z.object({
    _id: zId(),
    status : z.string().default("active").optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export const schemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
};

