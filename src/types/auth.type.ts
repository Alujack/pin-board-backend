import z from "zod";

export const loginZod = z.object({
    username: z.string().min(1, "username is required"),
    password: z.string().min(6, "password must be more than 6")
})
export const zSignUp = z.object({
    username: z.string().min(1, "Username is required").trim(),
    password: z.string().min(6, "Password must be at least 6 characters long").trim(),
});

export type TSignUp = z.infer<typeof zSignUp>;

export type LoginZod = z.infer<typeof loginZod>