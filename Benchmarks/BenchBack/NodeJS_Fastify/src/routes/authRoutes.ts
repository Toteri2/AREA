import { FastifyInstance } from 'fastify'
import { AuthService } from '../services/AuthService'

export async function authRoutes(app: FastifyInstance, authService: AuthService) {
  app.post('/auth/register', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }
    try {
      const result = await authService.register(email, password)
      return reply.send(result)
    } catch (error: any) {
      return reply.status(401).send({ message: error.message })
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }
    const user = await authService.validateUser(email, password)
    if (!user)
      return reply.status(401).send({ message: 'Credentials invalid' })
    return authService.login(user)
  })

  app.get('/auth/profile', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as any
    return { id: user.sub, email: user.email }
  })
}
