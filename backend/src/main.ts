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
    app.getHttpAdapter().getInstance().use((_req: any, res: any, next: any) => {
      if (_req.path.startsWith('/api') || _req.path.startsWith('/files')) return next();
      res.sendFile(join(webDistPath, 'index.html'));
    });
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
