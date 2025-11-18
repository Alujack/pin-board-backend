import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { NotificationTypeEnum } from "../types/enums.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zNotification = zModel.extend({
    user: zId().ref("User"),
    type: z.enum([
        NotificationTypeEnum.NEW_FOLLOWER,
        NotificationTypeEnum.PIN_LIKED,
        NotificationTypeEnum.PIN_SAVED,
        NotificationTypeEnum.BOARD_CREATED,
        NotificationTypeEnum.PIN_CREATED,
    ]),
    content: z.string().min(1).max(500),
    is_read: z.boolean().default(false),
    // Optional metadata for navigation and additional context
    metadata: z.object({
        pin_id: z.string().optional(),
        board_id: z.string().optional(),
        user_id: z.string().optional(),
        action: z.string().optional(),
    }).optional(),
    created_at: z.date().default(() => new Date()),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zNotification, schemaOptions)
const notificationModel = model("Notification", schema)
export { zNotification, notificationModel };
export type TypeNotification = z.infer<typeof zNotification>
