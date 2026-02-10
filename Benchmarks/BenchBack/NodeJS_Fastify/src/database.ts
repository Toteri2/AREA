import { DataSource } from 'typeorm'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'bench123',
  database: 'benchmark',
  entities: [User],
  synchronize: true,
  logging: false,
})
