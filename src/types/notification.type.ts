import z from "zod";

// Register FCM Token
export const registerFCMTokenSchema = z.object({
  fcm_token: z.string().min(1, "FCM token is required"),
});

export type RegisterFCMTokenRequest = z.infer<typeof registerFCMTokenSchema>;

// Get Notifications Query
export const getNotificationsQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Mark Notification as Read
export const markAsReadSchema = z.object({
  notification_id: z.string().min(1, "Notification ID is required"),
});

export type MarkAsReadRequest = z.infer<typeof markAsReadSchema>;

