import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('twitch_webhooks')
export class TwitchWebhook {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    subscriptionId: string;

    @Column()
    eventType: string;

    @Column({ type: 'json', nullable: true })
    condition: any;

    @Column({ default: 'enabled' })
    status: string;

    @Column({ nullable: true })
    callbackUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
