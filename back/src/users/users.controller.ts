import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('webhooks')
  @ApiOperation({ summary: 'Get user webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of user webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  getUserWebhooks(@Req() req) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const hooks = this.usersService.getUserWebhooks(userId);
    console.log('Retrieved user webhooks:', hooks);
    return hooks;
  }

  @Get('connection')
  @ApiOperation({ summary: 'Check if user is connected for given provider' })
  @ApiResponse({
    status: 200,
    description: 'User connection status retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async isUserConnected(
    @Req() req,
    @Query('provider') provider?: string
  ): Promise<{ connected: boolean }> {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const providerType = provider?.toLowerCase() as ProviderType;
    if (!providerType || !(providerType.toUpperCase() in ProviderType)) {
      return { connected: false };
    }
    const isConnected = await this.usersService.isUserConnected(
      userId,
      providerType
    );
    return { connected: isConnected };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  create(@Body() user: { email: string; password: string }) {
    return this.usersService.create(user.email, user.password);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved.',
  })
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  update(@Param('id') id: number, @Body() data: { email?: string }) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  remove(@Param('id') id: number) {
    return this.usersService.delete(id);
  }
}
