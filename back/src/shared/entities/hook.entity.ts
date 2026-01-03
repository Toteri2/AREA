import { User } from 'src/shared/entities/user.entity';
import { GmailEventType } from 'src/shared/enums/gmail-event.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('hooks')
export class Hook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'webhook_id' })
  webhookId: string;

  @Column({ name: 'service' })
  service: string;

  @Column({ name: 'last_history_id', nullable: true })
  lastHistoryId?: string;

  @Column({ name: 'event_type', type: 'int', nullable: true, default: 1 })
  eventType?: GmailEventType;
}
