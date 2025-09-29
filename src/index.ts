import express, { Express, Response, Request } from "express";
import dotenv from 'dotenv'
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors"
import userRoute from "./routes/user.route";
import authRoute from "./routes/auth.route";
dotenv.config()
const app: Express = express()
const port = process.env.PORT || 3000

//middleware
app.use(helmet()) //secure headers
app.use(cors()) //allow cors
app.use(express.json()) //json parse
app.use(morgan('combined')); // logging
app.use(express.urlencoded({ extended: true })); //parse body


app.use('/user', userRoute)
app.use('/auth', authRoute)
app.get("/", (req: Request, res: Response) => {
    res.send("welcome to pinterest api")
})

app.listen(port, () => {
    console.log(`😭😭😭 => app is running on http://localhost:${port}`)
})