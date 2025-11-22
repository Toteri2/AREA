import { UserService } from './UserService'
import { User } from '../entities/User'
import { FastifyInstance } from 'fastify'

export class AuthService {
  private userService: UserService
  private app: FastifyInstance

  constructor(app: FastifyInstance, userService: UserService) {
    this.app = app
    this.userService = userService
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email)
    if (!user)
      return null
    const isPassValid = await this.userService.checkPass(user, password)
    if (!isPassValid)
      return null
    return user
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id }
    const token = this.app.jwt.sign(payload)
    return {
      access_token: token,
      user: { id: user.id, email: user.email },
    }
  }

  async register(email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email)
    if (existingUser)
      throw new Error('This user already exists')
    const user = await this.userService.create(email, password)
    return this.login(user)
  }

  async validateUserById(id: number): Promise<User | null> {
    return this.userService.findById(id)
  }
}
