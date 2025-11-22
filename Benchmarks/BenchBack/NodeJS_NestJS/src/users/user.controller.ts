import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UserService) { }

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users;
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    const users = await this.userService.findById(id);
    if (users) {
      return users;
    }
    return null;
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: { email?: string }) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { deleted: true };
  }

  @Post()
  async create(@Body() data: { email: string; password: string }) {
    return this.userService.create(data.email, data.password);
  }
}
