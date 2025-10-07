import express, { Express, Response, Request } from "express";
import dotenv from 'dotenv'
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors"
import swaggerUi from "swagger-ui-express";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
// import { CORSPlugin } from "orpc/server/plugins";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Writable } from "stream";
import { OpenAPIGenerator } from "@orpc/openapi";
import { CORSPlugin } from "@orpc/server/plugins";
import { databaseConnection } from "./config/database.config.js";
import { fetchRequest } from "./config/helper.js";
import { router } from "./routes/index.js";
import { createContext, ExpressContext } from "./config/context.js";
import upload from './config/multer.js';
import { uploadService } from "./services/media/upload.service.js";

dotenv.config()
const app: Express = express()
const port = process.env.PORT || 3000
const env: string = process.env.NODE_ENV || ""
const baseUrl = process.env.BASE_URL
//middleware
app.use(helmet()) //secure headers
app.use(cors()) //allow cors
app.use(express.json()) //json parse
app.use(morgan('combined')); // logging
app.use(express.urlencoded({ extended: true })); //parse body
databaseConnection()


app.post('/api/upload/single', upload.single('image'), async (req, res) => {
  try {
    const result = await uploadService.uploadSingle(req.file);
    res.json({ success: true, message: "Image uploaded successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


const handler = new OpenAPIHandler(router, {
    plugins: [
    new CORSPlugin(),
    ...(env == "dev"
        ? [new OpenAPIReferencePlugin({
            schemaConverters: [ new ZodToJsonSchemaConverter() ],
            specGenerateOptions: {
                servers: [{ url: baseUrl + "/api"}],
                info: {
                    title: "Pin Board App",
                    version: "1.0.0",
                    description: "API documentation"
                },
                security: [
                    { bearerAuth: [] }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT"
                        }
                    }
                }
            }
        })]
        : [])
],
})

app.use("/api/", async (req: Request, res: Response, next) => {
    const context = await createContext(req)
    const request = fetchRequest(req)
    const { matched, response } = await handler.handle(request, {
        prefix: "/api",
        context: context
    })
    // if(matched){
    //     if(response.status >= 500) {
    //         const res = response.clone()
    //         const error = await res.json()
    //         console.warn({
    //             status: res.status,
    //             path: req.method,
    //             method: req.method,
    //             error,
    //         })
    //     }
    //     return re
    // }
    if (matched) {
    res.status(response.status);
    response.headers.forEach((value: any, key: any) => res.setHeader(key, value));
    response.body?.pipeTo(Writable.toWeb(res));
  } else {
    next();
  }
})

const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [ new ZodToJsonSchemaConverter()]
})

app.all("/openapi.json", async (context: ExpressContext) => {
    const spec = await openAPIGenerator.generate(router, {
        info: {
            title: "API Playground",
            version: "1.0.0",
        },
        servers: [{ url: "/api"}],
        security: [{ bearerAuth: []}],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer"
                }
            }
        }
    })
    return context.response.json(spec)
})



app.get("/", (req: Request, res: Response) => {
    res.send("welcome to pinterest api")
})

app.use("/api-docs", swaggerUi.serve, async (req: Request, res: Response) => {
  const spec = await openAPIGenerator.generate(router, {
    info: {
      title: "Pin Board App",
      version: "1.0.0",
      description: "API documentation"
    },
    servers: [{ url: baseUrl + "/api" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    }
  });
  return res.send(swaggerUi.generateHTML(spec));
});

app.listen(port, () => {
    console.log(`😭😭😭 => app is running on http://localhost:${port}`)
})