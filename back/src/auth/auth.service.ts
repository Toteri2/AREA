import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Provider, ProviderType } from '../users/entities/provider.entity'
import { User } from '../users/entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) { }

  async register(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = this.userRepository.create({ email, password: hashedPassword, name })
    return this.userRepository.save(user)
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email })
    if (user && await bcrypt.compare(password, user.password))
      return user
    return null
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email }
    return { access_token: this.jwtService.sign(payload), user: { id: user.id, email: user.email, name: user.name } }
  }

  async linkGithubAccount(userId: number, githubId: string, accessToken: string, refreshToken: string, username: string): Promise<Provider> {
    let provider = await this.providerRepository.findOne({ where: { userId, provider: ProviderType.GITHUB } })
    if (provider) {
      provider.accessToken = accessToken
      provider.refreshToken = refreshToken
      provider.username = username
    } else {
      provider = this.providerRepository.create({ userId, provider: ProviderType.GITHUB, providerUserId: githubId, accessToken, refreshToken, username })
    }
    return this.providerRepository.save(provider)
  }

  async getGithubProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({ userId, provider: ProviderType.GITHUB })
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token)
    } catch (error) {
      return null
    }
  }
}
