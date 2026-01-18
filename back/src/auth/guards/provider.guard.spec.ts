import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { AuthService } from '../auth.service';
import { ProviderGuard } from './provider.guard';

describe('ProviderGuard', () => {
  let guard: ProviderGuard;
  let authService: AuthService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getDiscordProvider: jest.fn(),
            getGithubProvider: jest.fn(),
            getGmailProvider: jest.fn(),
            getJiraProvider: jest.fn(),
            getMicrosoftProvider: jest.fn(),
            getTwitchProvider: jest.fn(),
          },
        },
      ],
    }).compile();

    // @ts-expect-error
    guard = module.get<ProviderGuard>(ProviderGuard);
    // @ts-expect-error
    authService = module.get<AuthService>(AuthService);
    // @ts-expect-error
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no provider is required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if no user session', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.DISCORD);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No user session found'
      );
    });

    it('should validate Discord provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.DISCORD);
      const mockProvider = { accessToken: 'discord-token' };
      jest
        .spyOn(authService, 'getDiscordProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      // @ts-expect-error - provider is attached dynamically by the guard
      expect(mockRequest.provider).toBe(mockProvider);
      expect(authService.getDiscordProvider).toHaveBeenCalledWith(1);
    });

    it('should validate GitHub provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.GITHUB);
      const mockProvider = { accessToken: 'github-token' };
      jest
        .spyOn(authService, 'getGithubProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(authService.getGithubProvider).toHaveBeenCalledWith(1);
    });

    it('should validate Gmail provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.GMAIL);
      const mockProvider = { accessToken: 'gmail-token' };
      jest
        .spyOn(authService, 'getGmailProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(authService.getGmailProvider).toHaveBeenCalledWith(1);
    });

    it('should validate Jira provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.JIRA);
      const mockProvider = { accessToken: 'jira-token' };
      jest
        .spyOn(authService, 'getJiraProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
    });

    it('should validate Microsoft provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.MICROSOFT);
      const mockProvider = { accessToken: 'microsoft-token' };
      jest
        .spyOn(authService, 'getMicrosoftProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(authService.getMicrosoftProvider).toHaveBeenCalledWith(1);
    });

    it('should validate Twitch provider', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.TWITCH);
      const mockProvider = { accessToken: 'twitch-token' };
      jest
        .spyOn(authService, 'getTwitchProvider')
        .mockResolvedValue(mockProvider as any);

      const mockRequest: any = { user: { id: 1 } };
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(authService.getTwitchProvider).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException if provider is not linked', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(ProviderType.DISCORD);
      jest.spyOn(authService, 'getDiscordProvider').mockResolvedValue(null);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'discord account not linked'
      );
    });
  });
});
