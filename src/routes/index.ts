import { authRoute } from "./auth.route.js";
import { userRoute } from "./user.route.js";
import { pinRoute } from "./pin.route.js";
import { boardRoute } from "./board.route.js";


export const router = {
    user: userRoute,
    auth: authRoute,
    pin: pinRoute,
    board: boardRoute,
}