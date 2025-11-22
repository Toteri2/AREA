import 'reflect-metadata'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { AppDataSource } from './database'
import { UserService } from './services/UserService'
import { AuthService } from './services/AuthService'
import { authRoutes } from './routes/authRoutes'
import { userRoutes } from './routes/userRoutes'

const app = Fastify({ logger: false })

app.register(fastifyJwt, {
  secret: 'ouais',
})

app.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

async function start() {
  try {
    await AppDataSource.initialize()

    const userService = new UserService()
    const existingUser = await userService.findByEmail('test@example.com')
    if (!existingUser) {
      await userService.create('test@example.com', 'password123')
      console.log('Test user created')
    }

    const authService = new AuthService(app, userService)

    await authRoutes(app, authService)
    await userRoutes(app, userService)

    await app.listen({ port: 3001, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3001')
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

start()
