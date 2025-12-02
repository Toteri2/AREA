import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) app.getHttpAdapter().getInstance().set('trust proxy', 1);

  console.log('CORS Origins:', corsOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'https://front.mambokara.dev',
        'https://front.mambokara.dev/',
        'http://localhost:5173',
        'http://localhost:5173/',
      ];

      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked: ' + origin));
      }
    },
    credentials: true,
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
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
