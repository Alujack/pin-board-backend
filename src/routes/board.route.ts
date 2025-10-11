import { ppr } from "../config/orpc.js";
import { boardController } from "../controllers/board.controller.js";
import { 
  createBoardRequestSchema, 
  updateBoardRequestSchema,
  boardQuerySchema
} from "../types/board.type.js";
import { pathIdZod } from "../types/common.js";

const path = "/boards";
const tags = ["Boards"];

export const boardRoute = {
  // Create a new board
  create: ppr([])
    .route({
      path: `${path}`,
      method: "POST",
      tags: tags
    })
    .input(createBoardRequestSchema)
    .handler(async ({ input, context }) => {
      return await boardController.createBoard(input, context);
    }),

  // Get boards with pagination and filtering
  getAll: ppr([])
    .route({
      path: `${path}`,
      method: "GET",
      tags: tags
    })
    .input(boardQuerySchema)
    .handler(async ({ input, context }) => {
      return await boardController.getBoards(input, context);
    }),

  // Get a single board by ID
  getOne: ppr([])
    .route({
      path: `${path}/:id`,
      method: "GET",
      tags: tags
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await boardController.getBoardById(id, context);
    }),

  // Update a board
  update: ppr([])
    .route({
      path: `${path}/:id`,
      method: "PUT",
      tags: tags
    })
    .input(updateBoardRequestSchema.extend({ id: pathIdZod.shape.id }))
    .handler(async ({ input, context }) => {
      const { id, ...updateData } = input;
      return await boardController.updateBoard(id, updateData, context);
    }),

  // Delete a board
  delete: ppr([])
    .route({
      path: `${path}/:id`,
      method: "DELETE",
      tags: tags
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await boardController.deleteBoard(id, context);
    }),

  // Get user's boards
  getUserBoards: ppr([])
    .route({
      path: `${path}/my-boards`,
      method: "GET",
      tags: tags
    })
    .handler(async ({ context }) => {
      return await boardController.getUserBoards(context);
    }),
};
