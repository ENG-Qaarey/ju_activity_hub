import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { isIP } from 'net';

// Load environment variables before anything else
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isPrivateIpv4 = (hostname: string) => {
    if (isIP(hostname) !== 4) return false;
    const [a, b] = hostname.split('.').map((n) => Number(n));
    if ([a, b].some((n) => Number.isNaN(n))) return false;

    // RFC1918 private ranges
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  };

  const isNgrokHostname = (hostname: string) => {
    const h = hostname.toLowerCase();
    return h.endsWith('.ngrok-free.dev') || h.endsWith('.ngrok.io');
  };

  // Static file hosting for uploaded avatars
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Enable CORS for frontend connection.
  // NOTE: In dev, Vite can be accessed via localhost/127.0.0.1/::1; allow those by default.
  const defaultFrontendOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://[::1]:8080',
    'http://localhost:5173',
  ];
  const envOriginsRaw =
    process.env.FRONTEND_URLS || process.env.FRONTEND_URL || defaultFrontendOrigins.join(',');
  const allowedOrigins = envOriginsRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // In development, Vite might pick a different port (8081, 8082, etc.).
      // Allow any localhost origin to prevent noisy CORS failures.
      if (process.env.NODE_ENV !== 'production') {
        try {
          const url = new URL(origin);
          if (
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1' ||
            url.hostname === '::1' ||
            isPrivateIpv4(url.hostname) ||
            isNgrokHostname(url.hostname)
          ) {
            return callback(null, true);
          }
        } catch {
          // fall through
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });


  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
}
bootstrap();
