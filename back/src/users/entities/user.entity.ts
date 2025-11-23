import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'text', unique: true })
  email: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text' })
  password: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
