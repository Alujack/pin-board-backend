import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

export enum CollaboratorRoleEnum {
    OWNER = "owner",
    EDITOR = "editor",
    VIEWER = "viewer"
}

const zBoardCollaborator = zModel.extend({
    board: zId().ref("Board"),
    user: zId().ref("User"),
    role: z.enum([CollaboratorRoleEnum.OWNER, CollaboratorRoleEnum.EDITOR, CollaboratorRoleEnum.VIEWER]).default(CollaboratorRoleEnum.VIEWER),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

// Create compound index to prevent duplicate collaborators
const schema = zodSchema(zBoardCollaborator, schemaOptions)
schema.index({ board: 1, user: 1 }, { unique: true });

const boardCollaboratorModel = model("BoardCollaborator", schema)
export { zBoardCollaborator, boardCollaboratorModel };
export type TypeBoardCollaborator = z.infer<typeof zBoardCollaborator>

