import { RoleEnum } from "../types/enums";
import { IUser } from "../types/user.type";
export class UserController {
    async getUser() {
        const user: IUser[] = [
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs", role: RoleEnum.ADMIN},
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs", role: RoleEnum.ADMIN}
        ]
        return user
    }

    async getOneUser(id: string) {
        const user: IUser[] = [
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs", role: RoleEnum.ADMIN},
            { id: "1ewrdf", username: "tralalelo", email: "asdf", passwrod: "sdfsdfs", role: RoleEnum.ADMIN}
        ]
        const result: IUser | undefined = user.find((user) => user.id === id)
        return result
    }
}