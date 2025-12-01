import { Test, TestingModule } from '@nestjs/testing';
import { DiscordService } from './discord.service';

describe('DiscordService', () => {
    let service: DiscordService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DiscordService],
        }).compile();

        service = module.get<DiscordService>(DiscordService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getServiceMetadata', () => {
        it('should return service metadata with actions and reactions', () => {
            const metadata = service.getServiceMetadata();

            expect(metadata).toBeDefined();
            expect(metadata.name).toBe('discord');
            expect(metadata.actions).toBeInstanceOf(Array);
            expect(metadata.reactions).toBeInstanceOf(Array);
        });

        it('should have 3 actions defined', () => {
            const metadata = service.getServiceMetadata();
            expect(metadata.actions).toHaveLength(3);

            const actionNames = metadata.actions.map((a) => a.name);
            expect(actionNames).toContain('new_message_in_channel');
            expect(actionNames).toContain('user_joins_guild');
            expect(actionNames).toContain('reaction_added');
        });

        it('should have 3 reactions defined', () => {
            const metadata = service.getServiceMetadata();
            expect(metadata.reactions).toHaveLength(3);

            const reactionNames = metadata.reactions.map((r) => r.name);
            expect(reactionNames).toContain('send_message');
            expect(reactionNames).toContain('add_role_to_user');
            expect(reactionNames).toContain('create_private_channel');
        });
    });

    describe('getHeaders', () => {
        it('should return correct headers with Bearer token', () => {
            const token = 'test_token_123';
            const headers = service.getHeaders(token);

            expect(headers).toEqual({
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            });
        });
    });

    describe('handleResponse', () => {
        it('should return parsed JSON for successful response', async () => {
            const mockData = { id: '123', name: 'Test' };
            const mockResponse = {
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockData),
            } as unknown as Response;

            const result = await service.handleResponse(mockResponse);
            expect(result).toEqual(mockData);
        });

        it('should return null for 204 No Content response', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                json: jest.fn(),
            } as unknown as Response;

            const result = await service.handleResponse(mockResponse);
            expect(result).toBeNull();
        });

        it('should throw HttpException for error response', async () => {
            const mockError = { message: 'Test error' };
            const mockResponse = {
                ok: false,
                status: 400,
                json: jest.fn().mockResolvedValue(mockError),
            } as unknown as Response;

            await expect(service.handleResponse(mockResponse)).rejects.toThrow();
        });
    });

    // Note: Les tests suivants nécessitent de mocker l'API Discord
    // ou d'utiliser un serveur de test

    describe('API Methods', () => {
        const mockToken = 'mock_discord_token';

        beforeEach(() => {
            // Mock global fetch
            global.fetch = jest.fn();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call Discord API for getCurrentUser', async () => {
            const mockUser = { id: '123', username: 'testuser' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.getCurrentUser(mockToken);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://discord.com/api/v10/users/@me',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken}`,
                    }),
                })
            );
            expect(result).toEqual(mockUser);
        });

        it('should call Discord API for listUserGuilds', async () => {
            const mockGuilds = [
                { id: '1', name: 'Guild 1' },
                { id: '2', name: 'Guild 2' },
            ];
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockGuilds),
            });

            const result = await service.listUserGuilds(mockToken);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://discord.com/api/v10/users/@me/guilds',
                expect.any(Object)
            );
            expect(result).toEqual(mockGuilds);
        });

        it('should call Discord API for sendMessage', async () => {
            const dto = {
                channelId: '123',
                content: 'Test message',
                embeds: [],
            };
            const mockMessage = { id: '456', content: 'Test message' };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockMessage),
            });

            const result = await service.sendMessage(mockToken, dto);

            expect(global.fetch).toHaveBeenCalledWith(
                `https://discord.com/api/v10/channels/${dto.channelId}/messages`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ content: dto.content, embeds: dto.embeds }),
                })
            );
            expect(result).toEqual(mockMessage);
        });

        it('should call Discord API for addRoleToUser', async () => {
            const dto = {
                guildId: '123',
                userId: '456',
                roleId: '789',
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 204,
            });

            const result = await service.addRoleToUser(mockToken, dto);

            expect(global.fetch).toHaveBeenCalledWith(
                `https://discord.com/api/v10/guilds/${dto.guildId}/members/${dto.userId}/roles/${dto.roleId}`,
                expect.objectContaining({
                    method: 'PUT',
                })
            );
            expect(result).toEqual({
                success: true,
                message: 'Role added successfully',
            });
        });

        it('should call Discord API for createPrivateChannel', async () => {
            const dto = {
                guildId: '123',
                name: 'private-channel',
                type: 0,
                permissionOverwrites: [],
            };
            const mockChannel = { id: '999', name: 'private-channel' };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockChannel),
            });

            const result = await service.createPrivateChannel(mockToken, dto);

            expect(global.fetch).toHaveBeenCalledWith(
                `https://discord.com/api/v10/guilds/${dto.guildId}/channels`,
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining(dto.name),
                })
            );
            expect(result).toEqual(mockChannel);
        });
    });
});
