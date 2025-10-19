import { ppr } from "../config/orpc.js";
import { pinController } from "../controllers/pin.controller.js";
import {
  createPinRequestSchema,
  updatePinRequestSchema,
  pinQuerySchema,
  assignTagsRequestSchema,
} from "../types/pin.type.js";
import { pathIdZod } from "../types/common.js";

const path = "/pins";
const tags = ["Pins"];

export const pinRoute = {
  // Get pins with pagination and filtering
  getAll: ppr([])
    .route({
      path: `${path}`,
      method: "GET",
      tags: tags,
    })
    .input(pinQuerySchema)
    .handler(async ({ input, context }) => {
      return await pinController.getPins(input, context);
    }),

  // Get a single pin by ID
  getOne: ppr([])
    .route({
      path: `${path}/:id`,
      method: "GET",
      tags: tags,
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await pinController.getPinById(id, context);
    }),

  // Update a pin
  update: ppr([])
    .route({
      path: `${path}/:id`,
      method: "PUT",
      tags: tags,
    })
    .input(updatePinRequestSchema.extend({ id: pathIdZod.shape.id }))
    .handler(async ({ input, context }) => {
      const { id, ...updateData } = input;
      return await pinController.updatePin(id, updateData, context);
    }),

  // Delete a pin
  delete: ppr([])
    .route({
      path: `${path}/:id`,
      method: "DELETE",
      tags: tags,
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await pinController.deletePin(id, context);
    }),

  // Assign tags to a pin
  assignTags: ppr([])
    .route({
      path: `${path}/:id/tags`,
      method: "POST",
      tags: tags,
    })
    .input(assignTagsRequestSchema.extend({ id: pathIdZod.shape.id }))
    .handler(async ({ input, context }) => {
      const { id, ...tagData } = input;
      return await pinController.assignTags(id, tagData, context);
    }),
  // Save a pin to user's saved pins
  savePin: ppr([])
    .route({
      path: `${path}/{id}/save`,
      method: "POST",
      tags: tags,
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await pinController.savePinToUser(id, context);
    }),
  // Get media URL (visible in OpenAPI) - resolves a pin id or public_id to a JSON with media_url
  getMediaUrl: ppr([])
    .route({
      // use OpenAPI path parameter syntax so the spec shows {id} correctly
      path: `${path}/media/{id}/download`,
      method: "GET",
      tags: tags,
    })
    .input(pathIdZod)
    .handler(async ({ input, context }) => {
      const id = input.id;
      return await pinController.getMediaUrl(id, context);
    }),

  // search endpoint
  search: ppr([])
    .route({
      path: `${path}/search`,
      method: "GET",
      tags: tags,
    })
    .input(pinQuerySchema)
    .handler(async ({ input, context }) => {
      return await pinController.getPins(input, context);
    }),
};
