export class AuthController {
    async login(username: string, password: string) {
        if(username === "admin" && password === "1234") {
            return { token: "fake-jwt-token" }
        }
        return null
    }
}
