import z from "zod";

export const idZod = z.object({
    _id: z.string().min(1, "invalid object id")
})

export const pathIdZod = z.object({
    id: z.string().min(1, "invalid object id")
})

export type TypeId = z.infer<typeof idZod>
export type TypePathId = z.infer<typeof pathIdZod>