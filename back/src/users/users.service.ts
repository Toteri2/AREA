import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { HookResponseDto } from 'src/shared/dto/hook-response.dto';
import { Hook } from 'src/shared/entities/hook.entity';
import { Provider } from 'src/shared/entities/provider.entity';
import { User } from 'src/shared/entities/user.entity';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>,
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>
  ) {}

  async create(email: string, password: string): Promise<User> {
    const hashedPass = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email: email,
      password: hashedPass,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async checkPass(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user);
  }

  async getUserWebhooks(userId: number): Promise<HookResponseDto[]> {
    const hooks = await this.hooksRepository.find({
      where: { userId: userId },
    });
    return hooks.map(
      (hook) =>
        new HookResponseDto({
          id: hook.id,
          userId: hook.userId,
          service: hook.service,
          eventType: hook.eventType,
          lastHistoryId: hook.lastHistoryId,
        })
    );
  }

  async isUserConnected(
    userId: number,
    provider: ProviderType
  ): Promise<boolean> {
    const linked = await this.providersRepository.findOne({
      where: { userId, provider },
    });
    if (linked) {
      return true;
    }
    return false;
  }
}
