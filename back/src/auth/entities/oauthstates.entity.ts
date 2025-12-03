import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProviderType {
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

@Entity('oauth_states')
export class OAuthState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  state: string;

  @Column({ name: 'provider' })
  provider: ProviderType;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
