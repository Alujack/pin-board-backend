import { IUser } from "../types/user.type";
export class UserController {
    async getUser() {
        const user: IUser[] = [
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs"},
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs"}
        ]
        return user
    }
}