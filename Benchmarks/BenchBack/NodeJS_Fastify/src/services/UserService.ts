import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/User'
import { AppDataSource } from '../database'

export class UserService {
  private usersRepository: Repository<User>

  constructor() {
    this.usersRepository = AppDataSource.getRepository(User)
  }

  async create(email: string, password: string): Promise<User> {
    const hashedPass = await bcrypt.hash(password, 10)
    const user = this.usersRepository.create({
      email: email,
      password: hashedPass,
    })
    return this.usersRepository.save(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: email })
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id: id })
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find()
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data)
    return this.usersRepository.findOneBy({ id: id })
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id)
  }

  async checkPass(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }
}
