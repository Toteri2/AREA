import { FastifyInstance } from 'fastify'
import { UserService } from '../services/UserService'

export async function userRoutes(app: FastifyInstance, userService: UserService) {
  app.get('/users', async (request, reply) => {
    const users = await userService.findAll()
    return users
  })

  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: number }
    const user = await userService.findById(id)
    if (user)
      return user
    return null
  })

  app.put('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: number }
    const data = request.body as { email?: string }
    return userService.update(id, data)
  })

  app.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await userService.delete(id)
    return { deleted: true }
  })

  app.post('/users', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }
    return userService.create(email, password)
  })
}
