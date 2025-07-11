import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const PORT = process.env.PORT || 3000;

// Function to get allowed origins based on the environment
function getAllowedOrigins(environment: string): any[] {
  const allowedOrigins: { [key: string]: any[] } = {
    production: [
      // 'https://hype3.trade',
      'https://hype3.cool',
      // /^https:\/\/.+\.hype3\.trade$/,
      /^https:\/\/.+\.hype3\.cool$/,
    ], // Replace with your production frontend URL
    dev: [
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:5000',
      // 'https://hype3.trade',
      'https://hype3.cool',
      // /^https:\/\/.+\.hype3\.trade$/,
      /^https:\/\/.+\.hype3\.cool$/,
    ],
    local: ['*'], // Allow all origins for local development
  };

  return allowedOrigins[environment] || []; // Return empty array if environment is not found
}

// Function to get CORS options based on the environment
function getCorsOptions(environment: string): CorsOptions {
  const allowedOrigins = getAllowedOrigins(environment);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // // Check if the origin is in the allowed origins
      // if (allowedOrigins.includes(origin) || allowedOrigins[0] === '*') {
      //   callback(null, true);
      // } else {
      //   callback(new Error('Not allowed by CORS'));
      // }
      if (
        allowedOrigins.some((allowedOrigin) => {
          if (typeof allowedOrigin === 'string') {
            return origin === allowedOrigin;
          } else {
            return allowedOrigin.test(origin);
          }
        })
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'Requires-Auth'],
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const environ = configService.get('NODE_ENV');
  const version = configService.get('VERSION');

  // Get CORS options based on the environment
  const corsOptions = getCorsOptions(environ);

  // app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      // transformOptions: {
      //   enableImplicitConversion: true, // 👈  transform based on TS type
      // },
    }),
  ); // add validation pipe globally

  // apply transform to all responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // config of swagger
  const config = new DocumentBuilder()
    .setTitle('Hype3 Cool API')
    .setDescription('Documentation of Hype3 Cool API')
    .setVersion(`${environ} v${version}`)
    .addTag('Auth', 'Authentication')
    .addTag('AuthUser', 'Authentication User')
    .addTag('User', 'Users in Hype3')
    .addTag('Creator', 'Creator in Hype3')
    .addTag('Agent', 'Agent in Hype3')
    .addTag('Subscription', 'Subscription in Hype3')
    .addTag('Token', 'Token in Hype3')
    .addTag('AppConfig', 'App Configurations')
    .addTag('Eliza', 'Eliza AI')
    // .addTag('Token', 'Hype3 Token v1')
    // .addTag('Transaction', 'Transactions')
    .addBearerAuth()
    .build();

  // initial and setup the route of swagger
  const document = SwaggerModule.createDocument(app as any, config);
  // https://cloud.tencent.com/developer/article/1952789
  SwaggerModule.setup('swagger', app as any, document, {
    // customSiteTitle: swaggerOptions.title,
    swaggerOptions: {
      explorer: true,
      docExpansion: 'none',
      filter: true,
      // showRequestDuration: true,
      // syntaxHighlight: {
      //   active: true,
      //   theme: "tomorrow-night"
      // }
    },
  });

  app.get(HttpAdapterHost);
  app.enableCors(corsOptions);
  await app.listen(PORT);
}
bootstrap();
