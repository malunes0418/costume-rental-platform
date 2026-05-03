import { z } from 'zod';
import { registry } from '../config/openapi';

// --- WISHLIST ---
registry.registerPath({
  method: 'post',
  path: '/wishlist',
  tags: ['Wishlist'],
  summary: 'Add to wishlist',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ costumeId: z.number() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Added to wishlist' } },
});

registry.registerPath({
  method: 'delete',
  path: '/wishlist/{costumeId}',
  tags: ['Wishlist'],
  summary: 'Remove from wishlist',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ costumeId: z.string() }) },
  responses: { 200: { description: 'Removed from wishlist' } },
});

registry.registerPath({
  method: 'get',
  path: '/wishlist',
  tags: ['Wishlist'],
  summary: 'List wishlist items',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Wishlist items' } },
});

// --- VENDOR ---
registry.registerPath({
  method: 'post',
  path: '/vendors/apply',
  tags: ['Vendor'],
  summary: 'Apply as vendor',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            storeName: z.string(),
            description: z.string(),
            businessDocument: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: { 200: { description: 'Application submitted' } },
});

registry.registerPath({
  method: 'get',
  path: '/vendors/me',
  tags: ['Vendor'],
  summary: 'Get vendor profile',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Vendor profile' } },
});

registry.registerPath({
  method: 'get',
  path: '/vendors/costumes',
  tags: ['Vendor'],
  summary: 'List vendor costumes',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of vendor costumes' } },
});

registry.registerPath({
  method: 'post',
  path: '/vendors/costumes',
  tags: ['Vendor'],
  summary: 'Create costume',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            description: z.string().optional(),
            dailyRate: z.number(),
          }), // Partial shape for brevity
        },
      },
    },
  },
  responses: { 200: { description: 'Costume created' } },
});

registry.registerPath({
  method: 'put',
  path: '/vendors/costumes/{id}',
  tags: ['Vendor'],
  summary: 'Update costume',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Costume updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/vendors/costumes/{id}',
  tags: ['Vendor'],
  summary: 'Delete costume',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Costume deleted' } },
});

registry.registerPath({
  method: 'get',
  path: '/vendors/reservations',
  tags: ['Vendor'],
  summary: 'List vendor reservations',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of vendor reservations' } },
});

registry.registerPath({
  method: 'post',
  path: '/vendors/reservations/{id}/approve',
  tags: ['Vendor'],
  summary: 'Approve reservation',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Reservation approved' } },
});

registry.registerPath({
  method: 'post',
  path: '/vendors/reservations/{id}/reject',
  tags: ['Vendor'],
  summary: 'Reject reservation',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Reservation rejected' } },
});

registry.registerPath({
  method: 'get',
  path: '/vendors/reservations/{id}/messages',
  tags: ['Vendor'],
  summary: 'List reservation messages',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'List of messages' } },
});

registry.registerPath({
  method: 'post',
  path: '/vendors/reservations/{id}/messages',
  tags: ['Vendor'],
  summary: 'Create reservation message',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ content: z.string() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Message created' } },
});

// --- REVIEWS ---
registry.registerPath({
  method: 'post',
  path: '/reviews',
  tags: ['Reviews'],
  summary: 'Create or update review',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ costumeId: z.number(), rating: z.number(), comment: z.string() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Review created or updated' } },
});

registry.registerPath({
  method: 'get',
  path: '/reviews/costumes/{costumeId}',
  tags: ['Reviews'],
  summary: 'List costume reviews',
  request: { params: z.object({ costumeId: z.string() }) },
  responses: { 200: { description: 'List of reviews' } },
});

registry.registerPath({
  method: 'delete',
  path: '/reviews/{id}',
  tags: ['Reviews'],
  summary: 'Delete review',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Review deleted' } },
});

// --- RESERVATIONS ---
registry.registerPath({
  method: 'post',
  path: '/reservations/cart',
  tags: ['Reservations'],
  summary: 'Add to cart',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ costumeId: z.number(), startDate: z.string(), endDate: z.string() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Added to cart' } },
});

registry.registerPath({
  method: 'post',
  path: '/reservations/checkout',
  tags: ['Reservations'],
  summary: 'Checkout cart',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Checkout successful' } },
});

registry.registerPath({
  method: 'get',
  path: '/reservations/my',
  tags: ['Reservations'],
  summary: 'Get my reservations',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of reservations' } },
});

// --- PAYMENTS ---
registry.registerPath({
  method: 'post',
  path: '/payments/proof',
  tags: ['Payments'],
  summary: 'Upload payment proof',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Proof uploaded' } },
});

registry.registerPath({
  method: 'get',
  path: '/payments/my',
  tags: ['Payments'],
  summary: 'Get my payments',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of payments' } },
});

// --- NOTIFICATIONS ---
registry.registerPath({
  method: 'get',
  path: '/notifications',
  tags: ['Notifications'],
  summary: 'List notifications',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of notifications' } },
});

registry.registerPath({
  method: 'post',
  path: '/notifications/{id}/read',
  tags: ['Notifications'],
  summary: 'Mark notification as read',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Notification marked as read' } },
});

// --- ADMIN ---
registry.registerPath({
  method: 'post',
  path: '/admin/payments/review',
  tags: ['Admin'],
  summary: 'Review payment',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ paymentId: z.number(), status: z.string() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Payment reviewed' } },
});

registry.registerPath({
  method: 'get',
  path: '/admin/reservations',
  tags: ['Admin'],
  summary: 'List reservations (admin)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of all reservations' } },
});

registry.registerPath({
  method: 'get',
  path: '/admin/payments',
  tags: ['Admin'],
  summary: 'List payments (admin)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of all payments' } },
});

registry.registerPath({
  method: 'get',
  path: '/admin/inventory',
  tags: ['Admin'],
  summary: 'List inventory (admin)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of all costumes' } },
});

registry.registerPath({
  method: 'get',
  path: '/admin/users',
  tags: ['Admin'],
  summary: 'List users (admin)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of all users' } },
});

registry.registerPath({
  method: 'get',
  path: '/admin/vendors/pending',
  tags: ['Admin'],
  summary: 'List pending vendors',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of pending vendors' } },
});

registry.registerPath({
  method: 'post',
  path: '/admin/vendors/{userId}/approve',
  tags: ['Admin'],
  summary: 'Approve vendor',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ userId: z.string() }) },
  responses: { 200: { description: 'Vendor approved' } },
});

registry.registerPath({
  method: 'post',
  path: '/admin/vendors/{userId}/reject',
  tags: ['Admin'],
  summary: 'Reject vendor',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ userId: z.string() }) },
  responses: { 200: { description: 'Vendor rejected' } },
});

registry.registerPath({
  method: 'patch',
  path: '/admin/costumes/{id}/status',
  tags: ['Admin'],
  summary: 'Update costume status (admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.string() }),
        },
      },
    },
  },
  responses: { 200: { description: 'Costume status updated' } },
});
