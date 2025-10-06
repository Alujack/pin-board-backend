import { z } from "zod";

export const uploadZod = z.object({
  image: z.string().nonempty(),
});
