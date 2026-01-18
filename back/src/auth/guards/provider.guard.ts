import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { AuthService } from '../auth.service';

export const PROVIDER_KEY = 'provider';
export const RequireProvider = (provider: ProviderType) =>
  SetMetadata(PROVIDER_KEY, provider);

@Injectable()
export class ProviderGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredProvider = this.reflector.getAllAndOverride<ProviderType>(
      PROVIDER_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredProvider) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }

    let provider: any = null;

    switch (requiredProvider) {
      case ProviderType.DISCORD:
        provider = await this.authService.getDiscordProvider(userId);
        break;
      case ProviderType.GITHUB:
        provider = await this.authService.getGithubProvider(userId);
        break;
      case ProviderType.GMAIL:
        provider = await this.authService.getGmailProvider(userId);
        break;
      case ProviderType.JIRA:
        provider = await this.authService.getJiraProvider(userId);
        break;
      case ProviderType.MICROSOFT:
        provider = await this.authService.getMicrosoftProvider(userId);
        break;
      case ProviderType.TWITCH:
        provider = await this.authService.getTwitchProvider(userId);
        break;
      default:
        throw new UnauthorizedException(
          `Unknown provider: ${requiredProvider}`
        );
    }
    if (!provider) {
      throw new UnauthorizedException(`${requiredProvider} account not linked`);
    }
    request.provider = provider;
    return true;
  }
}
