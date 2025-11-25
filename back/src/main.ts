import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 86400000,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        httpOnly: true,
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle('API AREA')
    .setDescription('The AREA API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
