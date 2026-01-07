import { ProviderType } from 'src/shared/enums/provider.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

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

  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  refreshToken: string;

  @Column({ name: 'provider_id', nullable: true, type: 'text' })
  providerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
