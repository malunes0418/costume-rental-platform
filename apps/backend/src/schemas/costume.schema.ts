import { z } from 'zod';
import { registry } from '../config/openapi';

export const CostumeImageSchema = registry.register(
  'CostumeImage',
  z.object({
    id: z.number().optional(),
    costumeId: z.number(),
    imageUrl: z.string(),
    isPrimary: z.boolean(),
  })
);

export const CostumeSchema = registry.register(
  'Costume',
  z.object({
    id: z.number().optional(),
    vendorId: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    dailyRate: z.number(),
    weeklyRate: z.number().nullable().optional(),
    monthlyRate: z.number().nullable().optional(),
    securityDeposit: z.number(),
    category: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'retired']),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    CostumeImages: z.array(CostumeImageSchema).optional(),
  })
);

export const CostumeListQuerySchema = registry.register(
  'CostumeListQuery',
  z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    size: z.string().optional(),
    gender: z.string().optional(),
    theme: z.string().optional(),
    sort: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  })
);

registry.registerPath({
  method: 'get',
  path: '/costumes',
  tags: ['Costumes'],
  summary: 'Get all costumes',
  request: {
    query: CostumeListQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of costumes',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(CostumeSchema),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
            totalPages: z.number(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/costumes/{id}',
  tags: ['Costumes'],
  summary: 'Get costume details by ID',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Costume details',
      content: {
        'application/json': {
          schema: z.object({
            costume: CostumeSchema,
            ratingCount: z.number(),
            avgRating: z.number().nullable(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/costumes/{id}/availability',
  tags: ['Costumes'],
  summary: 'Get costume availability',
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      startDate: z.string(),
      endDate: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of reservations for availability checking',
    },
  },
});
