import { registry } from '../config/openapi';

registry.registerPath({
  method: 'head',
  path: '/health',
  tags: ['Health'],
  summary: 'Public health check',
  responses: {
    204: {
      description: 'Service is healthy',
    },
  },
});
