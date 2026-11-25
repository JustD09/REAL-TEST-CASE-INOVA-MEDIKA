// Swagger/OpenAPI Documentation

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SIMRS Node.js Service API',
      version: '1.0.0',
      description: 'Service layer untuk SIMRS - Billing, Laboratorium, Integrasi BPJS/SATUSEHAT, Dashboard',
      contact: {
        name: 'Tianus',
        email: 'tianussembiringmilala@gmail.com',
      },
    },
    servers: [
      {
        url: `http://${process.env.SWAGGER_HOST || 'localhost:3001'}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDASI_GAGAL' },
                message: { type: 'string', example: 'Data tidak valid' },
                details: { type: 'object' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autentikasi & otorisasi' },
      { name: 'Billing', description: 'Tagihan & pembayaran' },
      { name: 'Laboratorium', description: 'Manajemen laboratorium' },
      { name: 'Dashboard', description: 'Ringkasan & analitik' },
      { name: 'Integration', description: 'Integrasi BPJS & SATUSEHAT' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SIMRS API Docs',
  }));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  console.info('[SWAGGER] Documentation available at /api-docs');
}

export default { setupSwagger, specs };
