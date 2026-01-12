import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigins =
    configService.getOrThrow<string>('FRONTEND_URL') || 'http://localhost:5173';

  const isProduction =
    configService.getOrThrow<string>('NODE_ENV') === 'production';

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
      secret: configService.getOrThrow<string>('SESSION_SECRET'),
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
  await app.listen(configService.getOrThrow<string>('PORT') ?? 8080);
}
bootstrap();
