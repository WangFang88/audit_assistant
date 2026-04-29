import 'dotenv/config';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  app.useStaticAssets(join(process.cwd(), '.data', 'uploads'), {
    prefix: '/files/',
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve Flutter Web static files (must be after API prefix)
  const webDistPath = process.env.WEB_DIST_PATH ?? join(process.cwd(), '..', 'web');
  if (require('node:fs').existsSync(webDistPath)) {
    app.useStaticAssets(webDistPath, { index: false });
    const { Router } = require('express');
    const router = Router();
    router.get('*', (_req: any, res: any) => res.sendFile(join(webDistPath, 'index.html')));
    app.use(router);
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
