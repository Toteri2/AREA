import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtSessionGuard } from './jwt-session.guard';

describe('JwtSessionGuard', () => {
  let guard: JwtSessionGuard;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtSessionGuard,
        {
          provide: AuthService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    // @ts-expect-error
    guard = module.get<JwtSessionGuard>(JwtSessionGuard);
    // @ts-expect-error
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no authorization header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No token provided'
      );
    });

    it('should throw UnauthorizedException if authorization header does not start with Bearer', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic token123',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No token provided'
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(null);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should set userId in session and return true if token is valid', async () => {
      const mockDecoded = { sub: 123 };
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockDecoded);

      const mockRequest: any = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        session: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.session.userId).toBe(123);
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should create session object if it does not exist', async () => {
      const mockDecoded = { sub: 456 };
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockDecoded);

      const mockRequest: any = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.session).toBeDefined();
      expect(mockRequest.session.userId).toBe(456);
    });
  });
});
