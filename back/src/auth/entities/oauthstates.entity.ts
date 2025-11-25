import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('oauth_states')
export class OAuthState {
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'user_id'})
    userId: number

    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'user_id' })
    user: User

    @Column({unique: true})
    state: string

    @Column({name: 'expires_at'})
    expiresAt: Date

    @CreateDateColumn()
    createdAt: Date
}