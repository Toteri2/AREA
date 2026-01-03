import { Hook } from 'src/shared/entities/hook.entity';
import { User } from 'src/shared/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ReactionType {
  SEND_EMAIL_OUTLOOK = 1,
  SEND_EMAIL_GMAIL = 2,
}

@Entity('reactions')
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'hook_id' })
  hookId: number;

  @ManyToOne(() => Hook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hook_id' })
  hook: Hook;

  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  reactionType: ReactionType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;
}
