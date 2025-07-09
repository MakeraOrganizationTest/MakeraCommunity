import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // define api folder under app folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Makera API Docs',
        version: '0.0.1'
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'supabase-auth-cookie',
            description:
              'Supabase authentication cookie (managed automatically by the browser)'
          }
        }
      },
      security: []
    }
  })
  return spec
}
