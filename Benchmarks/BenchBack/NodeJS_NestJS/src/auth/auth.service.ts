import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../users/user.service'
import { User } from '../users/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

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
    return { access_token: this.jwtService.sign(payload), user: { id: user.id, email: user.email, } }
  }

  async register(email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email)
    if (existingUser)
      throw new UnauthorizedException('This user already exists')
    const user = await this.userService.create(email, password)
    return this.login(user)
  }

  async validateUserById(id: number): Promise<User | null> {
    return this.userService.findById(id)
  }
}
