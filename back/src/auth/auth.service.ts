import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuthState } from 'src/shared/entities/oauthstates.entity';
import { Provider } from 'src/shared/entities/provider.entity';
import { User } from 'src/shared/entities/user.entity';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private msalConfig: Configuration;
  private scopes = [
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/Mail.Send',
    'offline_access',
  ];
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OAuthState)
    private oauthStatesRepository: Repository<OAuthState>,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.msalConfig = {
      auth: {
        clientId: this.configService.getOrThrow<string>('MICROSOFT_CLIENT_ID'),
        authority: 'https://login.microsoftonline.com/common',
        clientSecret: this.configService.getOrThrow<string>(
          'MICROSOFT_CLIENT_SECRET'
        ),
      },
    };
  }

  private getMsalClient() {
    return new ConfidentialClientApplication(this.msalConfig);
  }

  async getMicrosoftAuthUrl(): Promise<string> {
    const client = this.getMsalClient();
    const authUrl = await client.getAuthCodeUrl({
      scopes: this.scopes,
      redirectUri: this.configService.getOrThrow<string>(
        'MICROSOFT_CALLBACK_URL'
      ),
    });
    return authUrl;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (user && (await bcrypt.compare(password, user.password))) return user;
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async linkGithubAccount(
    userId: number,
    accessToken: string
  ): Promise<Provider> {
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.GITHUB },
    });
    if (provider) {
      provider.accessToken = accessToken;
    } else {
      provider = this.providerRepository.create({
        userId,
        user: { id: userId } as User,
        provider: ProviderType.GITHUB,
        accessToken,
      });
    }
    return this.providerRepository.save(provider);
  }

  async getGithubProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.GITHUB,
    });
  }

  async getMicrosoftProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.MICROSOFT,
    });
  }

  async linkDiscordAccount(
    userId: number,
    accessToken: string
  ): Promise<Provider> {
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.DISCORD },
    });
    if (provider) {
      provider.accessToken = accessToken;
    } else {
      provider = this.providerRepository.create({
        userId,
        provider: ProviderType.DISCORD,
        accessToken,
      });
    }
    return this.providerRepository.save(provider);
  }

  async getDiscordProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.DISCORD,
    });
  }
  async getGmailProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.GMAIL,
    });
  }

  async getJiraProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.JIRA,
    });
  }

  async linkTwitchAccount(
    userId: number,
    accessToken: string
  ): Promise<Provider> {
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.TWITCH },
    });
    if (provider) {
      provider.accessToken = accessToken;
    } else {
      provider = this.providerRepository.create({
        userId,
        provider: ProviderType.TWITCH,
        accessToken,
      });
    }
    return this.providerRepository.save(provider);
  }

  async getTwitchProvider(userId: number): Promise<Provider | null> {
    return this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.TWITCH,
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (_error) {
      return null;
    }
  }

  async createOAuthStateToken(
    userId: number,
    provider: ProviderType
  ): Promise<string> {
    const state = randomBytes(16).toString('hex');
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return '';
    const stateVal = this.oauthStatesRepository.create({
      userId: userId,
      user: user,
      state: state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      provider: provider,
    });
    await this.oauthStatesRepository.save(stateVal);
    return state;
  }

  async validateOAuthState(
    state: string,
    provider: ProviderType
  ): Promise<number | null> {
    const data = await this.oauthStatesRepository.findOneBy({ state });
    const date = Date.now();
    if (!data || +data.expiresAt < date) {
      await this.oauthStatesRepository.delete({ state, provider });
      return null;
    }
    await this.oauthStatesRepository.delete({ state, provider });
    return data.userId;
  }

  async findOauthState(
    state: string,
    provider: ProviderType
  ): Promise<boolean> {
    const stateFound = await this.oauthStatesRepository.findOneBy({
      state,
      provider,
    });
    if (!stateFound) {
      return false;
    }
    return true;
  }

  async getGithubToken(code: string): Promise<string> {
    const res = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GITHUB_CLIENT_SECRET'
        ),
        code: code,
        redirect_uri: this.configService.getOrThrow<string>(
          'GITHUB_CALLBACK_URL'
        ),
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    const accessToken = res.data.access_token;
    return accessToken;
  }

  async linkMicrosoftAccount(userId: number, code: string) {
    const client = this.getMsalClient();
    await client.acquireTokenByCode({
      code: code,
      scopes: this.scopes,
      redirectUri: this.configService.getOrThrow<string>(
        'MICROSOFT_CALLBACK_URL'
      ),
    });
    const cache = client.getTokenCache().serialize();
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.MICROSOFT },
    });
    if (provider) {
      provider.accessToken = cache;
    } else {
      provider = this.providerRepository.create({
        userId: userId,
        user: { id: userId } as User,
        provider: ProviderType.MICROSOFT,
        accessToken: cache,
      });
    }
    return this.providerRepository.save(provider);
  }

  async getMicrosoftToken(userId: number): Promise<string> {
    const provider = await this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.MICROSOFT,
    });
    if (!provider || !provider.accessToken) {
      throw new Error('Microsoft account not linked');
    }

    const client = this.getMsalClient();
    client.getTokenCache().deserialize(provider.accessToken);
    const accounts = await client.getTokenCache().getAllAccounts();
    if (accounts.length === 0) {
      throw new Error('No Microsoft account found');
    }

    const result = await client.acquireTokenSilent({
      account: accounts[0],
      scopes: this.scopes,
    });
    if (!result) {
      throw new Error('Could not acquire token');
    }

    const newCache = client.getTokenCache().serialize();
    if (newCache !== provider.accessToken) {
      provider.accessToken = newCache;
      await this.providerRepository.save(provider);
    }
    return result.accessToken;
  }
  async getDiscordToken(code: string): Promise<string> {
    const _redirectUri = this.configService.get<string>('DISCORD_CALLBACK_URL');

    const params = new URLSearchParams();
    params.append(
      'client_id',
      this.configService.getOrThrow('DISCORD_CLIENT_ID')
    );
    params.append(
      'client_secret',
      this.configService.getOrThrow('DISCORD_CLIENT_SECRET')
    );
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append(
      'redirect_uri',
      this.configService.getOrThrow('DISCORD_CALLBACK_URL')
    );

    const res = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return res.data.access_token;
  }

  async getGmailToken(
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.configService.getOrThrow<string>('GMAIL_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GMAIL_CLIENT_SECRET'
        ),
        code,
        grant_type: 'authorization_code',
        redirect_uri:
          this.configService.getOrThrow<string>('GMAIL_CALLBACK_URL'),
      });
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      console.error(
        'Error getting Gmail token:',
        error.response?.data || error.message
      );
      throw new Error('Failed to get Gmail access token');
    }
  }

  async linkGmailAccount(
    userId: number,
    accessToken: string,
    refreshToken?: string
  ): Promise<Provider> {
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.GMAIL },
    });
    if (provider) {
      provider.accessToken = accessToken;
      if (refreshToken) {
        provider.refreshToken = refreshToken;
      }
    } else {
      provider = this.providerRepository.create({
        userId,
        user: { id: userId } as User,
        provider: ProviderType.GMAIL,
        accessToken,
        refreshToken,
      });
    }
    return this.providerRepository.save(provider);
  }

  async refreshGmailToken(userId: number): Promise<string> {
    const provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.GMAIL },
    });

    if (!provider || !provider.refreshToken) {
      throw new Error('Gmail refresh token not found');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.configService.getOrThrow<string>('GMAIL_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GMAIL_CLIENT_SECRET'
        ),
        refresh_token: provider.refreshToken,
        grant_type: 'refresh_token',
      });

      const newAccessToken = response.data.access_token;

      provider.accessToken = newAccessToken;
      await this.providerRepository.save(provider);

      return newAccessToken;
    } catch (error) {
      console.error(
        'Error refreshing Gmail token:',
        error.response?.data || error.message
      );
      throw new Error('Failed to refresh Gmail access token');
    }
  }

  async getStoredGmailToken(userId: number): Promise<string> {
    const provider = await this.providerRepository.findOneBy({
      userId,
      provider: ProviderType.GMAIL,
    });
    if (!provider || !provider.accessToken) {
      throw new Error('Gmail account not linked');
    }
    return provider.accessToken;
  }

  async getValidGmailToken(userId: number): Promise<string> {
    try {
      const token = await this.getStoredGmailToken(userId);

      try {
        const response = await axios.get(
          'https://gmail.googleapis.com/gmail/v1/users/me/profile',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          return token;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          return await this.refreshGmailToken(userId);
        }
        throw error;
      }

      return token;
    } catch (error) {
      console.error('Error getting valid Gmail token:', error.message);
      throw error;
    }
  }

  async getJiraToken(
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append(
        'client_id',
        this.configService.getOrThrow<string>('JIRA_CLIENT_ID')
      );
      params.append(
        'client_secret',
        this.configService.getOrThrow<string>('JIRA_CLIENT_SECRET')
      );
      params.append('code', code);
      params.append(
        'redirect_uri',
        this.configService.getOrThrow<string>('JIRA_CALLBACK_URL')
      );

      const response = await axios.post(
        'https://auth.atlassian.com/oauth/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid or expired authorization code.');
      }
      throw error;
    }
  }

  async linkJiraAccount(
    userId: number,
    accessToken: string,
    refreshToken?: string,
    cloudId?: string
  ): Promise<Provider> {
    let provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.JIRA },
    });

    if (provider) {
      provider.accessToken = accessToken;
      if (refreshToken) {
        provider.refreshToken = refreshToken;
      }
      if (cloudId) {
        provider.providerId = cloudId;
      }
    } else {
      provider = this.providerRepository.create({
        userId,
        user: { id: userId } as User,
        provider: ProviderType.JIRA,
        accessToken,
        refreshToken: refreshToken || undefined,
        providerId: cloudId || undefined,
      });
    }

    return this.providerRepository.save(provider);
  }

  async getJiraCloudId(accessToken: string): Promise<string> {
    const response = await axios.get(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }

    throw new Error('No Jira cloud resources found');
  }

  async refreshJiraToken(userId: number): Promise<string> {
    const provider = await this.providerRepository.findOne({
      where: { userId, provider: ProviderType.JIRA },
    });

    if (!provider || !provider.refreshToken) {
      throw new Error('Jira refresh token not found');
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append(
        'client_id',
        this.configService.getOrThrow<string>('JIRA_CLIENT_ID')
      );
      params.append(
        'client_secret',
        this.configService.getOrThrow<string>('JIRA_CLIENT_SECRET')
      );
      params.append('refresh_token', provider.refreshToken);

      const response = await axios.post(
        'https://auth.atlassian.com/oauth/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;

      provider.accessToken = newAccessToken;
      if (newRefreshToken) {
        provider.refreshToken = newRefreshToken;
      }

      await this.providerRepository.save(provider);

      return newAccessToken;
    } catch (error) {
      console.error(
        'Error refreshing Jira token:',
        error.response?.data || error.message
      );
      throw new Error('Failed to refresh Jira access token');
    }
  }

  async getValidJiraToken(userId: number): Promise<string> {
    try {
      const provider = await this.providerRepository.findOneBy({
        userId,
        provider: ProviderType.JIRA,
      });

      if (!provider || !provider.accessToken) {
        throw new Error('Jira account not linked');
      }

      try {
        const response = await axios.get(
          'https://api.atlassian.com/oauth/token/accessible-resources',
          {
            headers: {
              Authorization: `Bearer ${provider.accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (response.status === 200) {
          return provider.accessToken;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          return await this.refreshJiraToken(userId);
        }
        throw error;
      }

      return provider.accessToken;
    } catch (error) {
      console.error('Error getting valid Jira token:', error.message);
      throw error;
    }
  }

  async findOrCreateGoogleUser(
    email: string,
    name: string,
    googleId: string
  ): Promise<User> {
    let user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      const randomPassword = await bcrypt.hash(
        randomBytes(32).toString('hex'),
        10
      );
      user = this.userRepository.create({
        email,
        name,
        password: randomPassword,
      });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async getGoogleUserInfo(
    code: string
  ): Promise<{ accessToken: string; email: string; name: string }> {
    try {
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: process.env.GMAIL_CLIENT_ID,
          client_secret: process.env.GMAIL_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        }
      );
      const accessToken = tokenResponse.data.access_token;
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return {
        accessToken,
        email: userInfoResponse.data.email,
        name: userInfoResponse.data.name,
      };
    } catch (error) {
      console.error(
        'Error getting Google user info:',
        error.response?.data || error.message
      );
      throw new Error('Failed to get Google user info');
    }
  }

  async getTwitchToken(code: string): Promise<string> {
    const params = new URLSearchParams();
    params.append(
      'client_id',
      this.configService.getOrThrow('TWITCH_CLIENT_ID')
    );
    params.append(
      'client_secret',
      this.configService.getOrThrow('TWITCH_CLIENT_SECRET')
    );
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append(
      'redirect_uri',
      this.configService.getOrThrow('TWITCH_CALLBACK_URL')
    );

    const res = await axios.post('https://id.twitch.tv/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data.access_token;
  }
}
