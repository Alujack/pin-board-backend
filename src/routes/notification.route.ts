import { ppr } from "../config/orpc.js";
import { notificationController } from "../controllers/notification.controller.js";
import {
  registerFCMTokenSchema,
  getNotificationsQuerySchema,
  markAsReadSchema,
} from "../types/notification.type.js";

const path = "/notifications";
const tags = ["Notifications"];

export const notificationRoute = {
  // Register FCM token
  registerToken: ppr([])
    .route({
      path: `${path}/register-token`,
      method: "POST",
      tags: tags,
    })
    .input(registerFCMTokenSchema)
    .handler(async ({ input, context }) => {
      return await notificationController.registerFCMToken(input, context);
    }),

  // Remove FCM token
  removeToken: ppr([])
    .route({
      path: `${path}/remove-token`,
      method: "POST",
      tags: tags,
    })
    .handler(async ({ context }) => {
      return await notificationController.removeFCMToken(context);
    }),

  // Get notifications
  getAll: ppr([])
    .route({
      path: `${path}`,
      method: "GET",
      tags: tags,
    })
    .input(getNotificationsQuerySchema)
    .handler(async ({ input, context }) => {
      return await notificationController.getNotifications(input, context);
    }),

  // Mark notification as read
  markAsRead: ppr([])
    .route({
      path: `${path}/mark-read`,
      method: "POST",
      tags: tags,
    })
    .input(markAsReadSchema)
    .handler(async ({ input, context }) => {
      return await notificationController.markAsRead(input, context);
    }),

  // Mark all notifications as read
  markAllAsRead: ppr([])
    .route({
      path: `${path}/mark-all-read`,
      method: "POST",
      tags: tags,
    })
    .handler(async ({ context }) => {
      return await notificationController.markAllAsRead(context);
    }),
};

