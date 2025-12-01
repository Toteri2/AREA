import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ProviderType {
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
  DISCORD = 'discord',
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ProviderType })
  provider: ProviderType;

  @Column({ name: 'access_token', nullable: true, type: 'text' })
  accessToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
