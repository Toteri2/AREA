import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import session from 'express-session'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
  }))

  await app.listen(process.env.PORT ?? 8080)
}
bootstrap()
