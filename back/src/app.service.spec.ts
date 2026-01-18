import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    // @ts-expect-error
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return welcome message', () => {
      const result = service.getHello();
      expect(result).toContain('Welcome to AREA');
      expect(result).toContain('/api-docs');
    });
  });

  describe('getAbout', () => {
    it('should return about information with client IP from x-forwarded-for', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      } as unknown as Request;

      const result = service.getAbout(mockRequest);

      expect(result.client.host).toBe('192.168.1.1');
      expect(result.server.current_time).toBeDefined();
      expect(result.server.services).toBeDefined();
      expect(result.server.services.length).toBeGreaterThan(0);
    });

    it('should return about information with client IP from x-real-ip', () => {
      const mockRequest = {
        headers: {
          'x-real-ip': '192.168.1.100',
        },
      } as unknown as Request;

      const result = service.getAbout(mockRequest);

      expect(result.client.host).toBe('192.168.1.100');
    });

    it('should strip ::ffff: prefix from IPv6-mapped IPv4 addresses', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '::ffff:192.168.1.1',
        },
      } as unknown as Request;

      const result = service.getAbout(mockRequest);

      expect(result.client.host).toBe('192.168.1.1');
    });

    it('should include all services in about response', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      } as unknown as Request;

      const result = service.getAbout(mockRequest);

      const serviceNames = result.server.services.map((s) => s.name);
      expect(serviceNames).toContain('discord');
      expect(serviceNames).toContain('github');
      expect(serviceNames).toContain('gmail');
      expect(serviceNames).toContain('jira');
      expect(serviceNames).toContain('microsoft');
      expect(serviceNames).toContain('twitch');
    });

    it('should include discord service with actions and reactions', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      } as unknown as Request;

      const result = service.getAbout(mockRequest);

      const discordService = result.server.services.find(
        (s) => s.name === 'discord'
      );
      expect(discordService).toBeDefined();
      if (discordService) {
        expect(discordService.actions.length).toBeGreaterThan(0);
        expect(discordService.reactions.length).toBeGreaterThan(0);
      }
    });

    it('should return current timestamp', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      } as unknown as Request;

      const beforeTime = Math.floor(Date.now() / 1000);
      const result = service.getAbout(mockRequest);
      const afterTime = Math.floor(Date.now() / 1000);

      expect(result.server.current_time).toBeGreaterThanOrEqual(beforeTime);
      expect(result.server.current_time).toBeLessThanOrEqual(afterTime);
    });
  });
});
