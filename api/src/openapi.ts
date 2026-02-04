import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resto Discovery API',
      version: '1.0.0',
      description: 'API for curated restaurant discovery',
    },
    servers: [
      {
        url: '/api',
        description: 'API endpoints',
      },
    ],
    components: {
      schemas: {
        City: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            kind: { type: 'string', enum: ['cuisine', 'vibe'] },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            city: { type: 'string', nullable: true },
            street: { type: 'string', nullable: true },
            house_number: { type: 'string', nullable: true },
            house_number_addition: { type: 'string', nullable: true },
            postcode: { type: 'string', nullable: true },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            why_curated: { type: 'string', nullable: true },
            price_level: { type: 'integer', minimum: 1, maximum: 4, nullable: true },
            lat: { type: 'number', nullable: true },
            lng: { type: 'number', nullable: true },
            address: { type: 'string', nullable: true },
            hero_image_url: { type: 'string', nullable: true },
            gallery_urls: { type: 'array', items: { type: 'string' } },
            is_published: { type: 'boolean' },
            featured_rank: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'metasuite_session',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      checks: { type: 'object' },
                    },
                  },
                },
              },
            },
            '503': { description: 'Service is unhealthy' },
          },
        },
      },
      '/cities': {
        get: {
          summary: 'List top cities',
          tags: ['Public'],
          responses: {
            '200': {
              description: 'List of cities',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/City' },
                  },
                },
              },
            },
          },
        },
      },
      '/tags': {
        get: {
          summary: 'List all tags',
          tags: ['Public'],
          responses: {
            '200': {
              description: 'List of tags',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Tag' },
                  },
                },
              },
            },
          },
        },
      },
      '/locations': {
        get: {
          summary: 'List locations',
          tags: ['Public'],
          parameters: [
            { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Filter by city slug' },
            { name: 'bbox', in: 'query', schema: { type: 'string' }, description: 'Bounding box: west,south,east,north' },
            { name: 'tag_slugs', in: 'query', schema: { type: 'string' }, description: 'Filter by tag slugs (comma-separated)' },
            { name: 'price_min', in: 'query', schema: { type: 'integer' }, description: 'Minimum price level' },
            { name: 'price_max', in: 'query', schema: { type: 'integer' }, description: 'Maximum price level' },
          ],
          responses: {
            '200': {
              description: 'List of locations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Location' },
                  },
                },
              },
            },
          },
        },
      },
      '/locations/{id}': {
        get: {
          summary: 'Get location by ID',
          tags: ['Public'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Location details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Location' },
                },
              },
            },
            '404': { description: 'Location not found' },
          },
        },
      },
      '/me': {
        get: {
          summary: 'Get current user',
          tags: ['User'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': {
              description: 'Current user info',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/me/favorites': {
        get: {
          summary: 'Get user favorites',
          tags: ['User'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': {
              description: 'List of favorite locations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Location' },
                  },
                },
              },
            },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/me/favorites/{locationId}': {
        post: {
          summary: 'Add to favorites',
          tags: ['User'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'locationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '201': { description: 'Added to favorites' },
            '401': { description: 'Not authenticated' },
          },
        },
        delete: {
          summary: 'Remove from favorites',
          tags: ['User'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'locationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Removed from favorites' },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/admin/tags': {
        post: {
          summary: 'Create tag',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['kind', 'name', 'slug'],
                  properties: {
                    kind: { type: 'string', enum: ['cuisine', 'vibe'] },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Tag created' },
          },
        },
      },
      '/admin/tags/{id}': {
        put: {
          summary: 'Update tag',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { '200': { description: 'Tag updated' } },
        },
        delete: {
          summary: 'Delete tag',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { '200': { description: 'Tag deleted' } },
        },
      },
      '/admin/address-lookup': {
        get: {
          summary: 'Lookup address by postcode and house number',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'postcode', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'house_number', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'house_number_addition', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Address lookup result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      street: { type: 'string', nullable: true },
                      city: { type: 'string', nullable: true },
                      postcode: { type: 'string', nullable: true },
                      house_number: { type: 'string', nullable: true },
                      house_number_addition: { type: 'string', nullable: true },
                      lat: { type: 'number', nullable: true },
                      lng: { type: 'number', nullable: true },
                      address: { type: 'string', nullable: true },
                    },
                  },
                },
              },
            },
            '400': { description: 'Invalid request' },
            '404': { description: 'Address not found' },
          },
        },
      },
      '/admin/locations': {
        get: {
          summary: 'List locations (admin)',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': {
              description: 'List of locations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Location' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create location',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'slug'],
                  properties: {
                    city: { type: 'string' },
                    street: { type: 'string' },
                    house_number: { type: 'string' },
                    house_number_addition: { type: 'string' },
                    postcode: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    why_curated: { type: 'string' },
                    price_level: { type: 'integer' },
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                    address: { type: 'string' },
                    hero_image_url: { type: 'string' },
                    gallery_urls: { type: 'array', items: { type: 'string' } },
                    is_published: { type: 'boolean' },
                    featured_rank: { type: 'integer' },
                    tag_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Location created' } },
        },
      },
      '/admin/locations/{id}': {
        put: {
          summary: 'Update location',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { '200': { description: 'Location updated' } },
        },
        delete: {
          summary: 'Delete location',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { '200': { description: 'Location deleted' } },
        },
      },
    },
  },
  apis: [],
};

export const openapiSpec = swaggerJsdoc(options);
