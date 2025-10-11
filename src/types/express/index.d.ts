import { AuthUser } from "../user.type.ts";
declare namespace Express {
  export interface Request {
    file?: Multer.File;
  }
   interface Request {
      user?: AuthUser;
    }
}
