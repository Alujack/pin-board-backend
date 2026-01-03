import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { NotificationTypeEnum } from "../types/enums.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zNotification = zModel.extend({
    user: zId().ref("User"),
    from_user: zId().ref("User").optional(), // User who triggered the notification
    type: z.enum([
        NotificationTypeEnum.NEW_FOLLOWER,
        NotificationTypeEnum.PIN_LIKED,
        NotificationTypeEnum.PIN_SAVED,
        NotificationTypeEnum.PIN_COMMENTED,
        NotificationTypeEnum.COMMENT_REPLIED,
        NotificationTypeEnum.COMMENT_LIKED,
        NotificationTypeEnum.BOARD_CREATED,
        NotificationTypeEnum.PIN_CREATED,
        NotificationTypeEnum.BOARD_INVITE,
    ]),
    content: z.string().min(1).max(500),
    is_read: z.boolean().default(false),
    // Optional metadata for navigation and additional context
    metadata: z.record(z.string(), z.any()).optional(), // Allow any key-value pairs
    created_at: z.date().default(() => new Date()),
}).omit({ _id: true }) // Completely omit _id from Zod schema - let Mongoose handle it

const schema = zodSchema(zNotification, schemaOptions)
// Mongoose automatically handles _id generation, so we don't need to modify it
// The _id field is completely omitted from the Zod schema, so Mongoose will handle it natively
const notificationModel = model("Notification", schema)
export { zNotification, notificationModel };
export type TypeNotification = z.infer<typeof zNotification>
