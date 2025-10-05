import { authRoute } from "./auth.route.js";
import { userRoute } from "./user.route.js";


export const router = {
    user: userRoute,
    auth: authRoute,
}