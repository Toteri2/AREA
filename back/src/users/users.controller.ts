import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() user: { email: string, password: string }) {
    return this.usersService.create(user.email, user.password)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() data: { email?: string }) {
    return this.usersService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.delete(id)
  }
}
