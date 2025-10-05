import z from "zod";

export const idZod = z.object({
    _id: z.string().min(1, "invalid object id")
})

export type TypeId = z.infer<typeof idZod>