import { z } from 'zod';
import { registry } from '../config/openapi';

export const UserSummarySchema = registry.register(
  'UserSummary',
  z.object({
    id: z.number(),
    email: z.string().email(),
    role: z.string(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  })
);

export const RegisterRequestSchema = registry.register(
  'RegisterRequest',
  z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  })
);

export const LoginRequestSchema = registry.register(
  'LoginRequest',
  z.object({
    email: z.string().email(),
    password: z.string(),
  })
);

export const AuthTokenResponseSchema = registry.register(
  'AuthTokenResponse',
  z.object({
    user: UserSummarySchema,
    token: z.string(),
  })
);

export const MeResponseSchema = registry.register(
  'MeResponse',
  z.object({
    id: z.number(),
    role: z.string(),
  })
);

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully registered',
      content: {
        'application/json': {
          schema: AuthTokenResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login to an existing account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully logged in',
      content: {
        'application/json': {
          schema: AuthTokenResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get current user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user info',
      content: {
        'application/json': {
          schema: MeResponseSchema,
        },
      },
    },
  },
});
