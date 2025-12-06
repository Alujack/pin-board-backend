import { authRoute } from "./auth.route.js";
import { userRoute } from "./user.route.js";
import { pinRoute } from "./pin.route.js";
import { boardRoute } from "./board.route.js";
import { notificationRoute } from "./notification.route.js";
import { interactionRoute } from './interaction.route.js';
import { commentRoute } from "./comment.route.js";
import { pinLikeRoute } from "./pin-like.route.js";
import { followRoute } from "./follow.route.js";
import { feedRoute } from "./feed.route.js";
import { boardCollaboratorRoute } from "./board-collaborator.route.js";
import { shareRoute } from "./share.route.js";


export const router = {
    user: userRoute,
    auth: authRoute,
    pin: pinRoute,
    board: boardRoute,
    notification: notificationRoute,
    interaction: interactionRoute,
    comment: commentRoute,
    pinLike: pinLikeRoute,
    follow: followRoute,
    feed: feedRoute,
    boardCollaborator: boardCollaboratorRoute,
    share: shareRoute,
}