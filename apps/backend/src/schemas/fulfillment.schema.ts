import { z } from "zod";
import { registry } from "../config/openapi";

const fulfillmentModeSchema = z.enum(["PICKUP", "DELIVERY", "BOTH"]);
const fulfillmentMethodSchema = z.enum(["PICKUP", "DELIVERY"]);
const fulfillmentWindowSlotSchema = z.enum(["MORNING", "AFTERNOON", "EVENING"]);
const savedLocationSchema = z.object({
  label: z.string().min(1),
  contact_name: z.string().min(1),
  phone_number: z.string().min(1),
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  city: z.string().min(1),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_default: z.boolean().optional()
});
const serviceAreaSchema = z.object({
  label: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const reservationFulfillmentSelectionSchema = z.object({
  outbound_method: fulfillmentMethodSchema,
  return_method: fulfillmentMethodSchema,
  pickup_window_slot: fulfillmentWindowSlotSchema.nullable().optional(),
  delivery_window_slot: fulfillmentWindowSlotSchema.nullable().optional(),
  return_window_slot: fulfillmentWindowSlotSchema,
  outbound_location: z.object({
    saved_location_id: z.number().nullable().optional(),
    new_location: savedLocationSchema.nullable().optional(),
    save_as_default: z.boolean().optional()
  }).nullable().optional(),
  return_location: z.object({
    saved_location_id: z.number().nullable().optional(),
    new_location: savedLocationSchema.nullable().optional(),
    save_as_default: z.boolean().optional()
  }).nullable().optional(),
  use_same_location_for_return: z.boolean().optional()
});

registry.registerPath({
  method: "get",
  path: "/vendors/fulfillment-settings",
  tags: ["Vendor"],
  summary: "Get vendor fulfillment settings",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Vendor fulfillment settings" } }
});

registry.registerPath({
  method: "put",
  path: "/vendors/fulfillment-settings",
  tags: ["Vendor"],
  summary: "Create or update vendor fulfillment settings",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            primary_location: z.record(z.string(), z.unknown()).nullable().optional(),
            outbound_mode: fulfillmentModeSchema,
            return_mode: fulfillmentModeSchema,
            outbound_pickup_fee: z.union([z.number(), z.string()]).optional(),
            outbound_delivery_fee: z.union([z.number(), z.string()]).optional(),
            return_pickup_fee: z.union([z.number(), z.string()]).optional(),
            return_delivery_fee: z.union([z.number(), z.string()]).optional(),
            service_areas: z.array(serviceAreaSchema).nullable().optional()
          })
        }
      }
    }
  },
  responses: { 200: { description: "Vendor fulfillment settings saved" } }
});

registry.registerPath({
  method: "get",
  path: "/account/locations",
  tags: ["Account"],
  summary: "List saved renter locations",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Saved locations" } }
});

registry.registerPath({
  method: "post",
  path: "/account/locations",
  tags: ["Account"],
  summary: "Create a saved renter location",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: savedLocationSchema
        }
      }
    }
  },
  responses: { 201: { description: "Saved location created" } }
});

registry.registerPath({
  method: "put",
  path: "/account/locations/{id}",
  tags: ["Account"],
  summary: "Update a saved renter location",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: savedLocationSchema
        }
      }
    }
  },
  responses: { 200: { description: "Saved location updated" } }
});

registry.registerPath({
  method: "delete",
  path: "/account/locations/{id}",
  tags: ["Account"],
  summary: "Delete a saved renter location",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: { 200: { description: "Saved location deleted" } }
});

const fulfillmentPreferencesSchema = z.object({
  default_saved_location_id: z.number().nullable().optional(),
  default_delivery_window_slot: fulfillmentWindowSlotSchema.nullable().optional(),
  default_return_window_slot: fulfillmentWindowSlotSchema.nullable().optional()
});

registry.registerPath({
  method: "get",
  path: "/account/fulfillment-preferences",
  tags: ["Account"],
  summary: "Get user fulfillment preferences",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "User fulfillment preferences" } }
});

registry.registerPath({
  method: "put",
  path: "/account/fulfillment-preferences",
  tags: ["Account"],
  summary: "Create or update user fulfillment preferences",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: fulfillmentPreferencesSchema
        }
      }
    }
  },
  responses: { 200: { description: "User fulfillment preferences saved" } }
});
