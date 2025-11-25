import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Provider, ProviderType } from '../users/entities/provider.entity'
import { User } from '../users/entities/user.entity'
import { OAuthState } from './entities/oauthstates.entity'
import { randomBytes } from 'crypto'
import axios from 'axios'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OAuthState)
    private oauthStatesRepository: Repository<OAuthState>,
    private jwtService: JwtService,

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

  async linkGithubAccount(userId: number ,accessToken: string): Promise<Provider> {
    let provider = await this.providerRepository.findOne({ where: { userId, provider: ProviderType.GITHUB } })
    if (provider) {
      provider.accessToken = accessToken
    } else {
      provider = this.providerRepository.create({ userId, provider: ProviderType.GITHUB, accessToken })
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

  async createOAuthStateToken(userId: number): Promise<string> {
    const state = randomBytes(16).toString('hex')
    const user = await this.userRepository.findOneBy({id: userId})
    if (!user)
      return ""
    const stateVal = this.oauthStatesRepository.create({userId, state, expiresAt: new Date(Date.now() + 10 * 60 * 1000)})
    await this.oauthStatesRepository.save(stateVal)
    return state
  }

  async validateOAuthState(state: string): Promise<number | null> {
    const data = await this.oauthStatesRepository.findOneBy({state})
    const date = Date.now()
    if (!data || +data.expiresAt < date) {
      await this.oauthStatesRepository.delete({state})
      return null
    }
    await this.oauthStatesRepository.delete({state})
    return data.userId
  }

  async getGithubToken(code: string): Promise<string> {
    const res = await axios.get("https://github.com/login/oauth/access_token", {
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "application/json",
        },
      }
    );
    const access_token = res.data.access_token;
    console.log(res)
    return access_token
  }
}
