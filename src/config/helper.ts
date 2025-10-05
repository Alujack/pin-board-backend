
import { Request as ExpressRequest} from 'express'
export function fetchRequest(req: ExpressRequest): Request {
    const origin = `${req.protocol}://${req.get("host")}`
    const url = new URL(req.originalUrl || req.url, origin)
    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        if (typeof req.body === "string" || req.body instanceof Buffer) {
            body = req.body;
        } else {
            body = JSON.stringify(req.body);
        }
    }
    return new Request(url.toString(), {
        method: req.method,
        headers: req.headers as any,
        body,
    });
}