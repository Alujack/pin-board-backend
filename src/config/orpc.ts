import { Context, os } from "@orpc/server";

const o = os.$context<Context>()
export const public_permission = o