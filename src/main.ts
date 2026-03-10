import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const whitelist = ['*'];

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: false,
    }),
  ); 
                      
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes('*') || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  /**
   * Stripe needs raw body for webhook signature verification.
   * This must be registered BEFORE the general JSON body parser.
   */
  app.use(
    '/api/v1/transaction/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
    
  // Normal JSON parsing for all other routes
  app.use(bodyParser.json({ limit: '5mb' }));

  const config = new DocumentBuilder()
    .setTitle('Teevil backend')
    .setDescription(
      'Online platform that connects freelancers and clients, enabling collaboration, project management',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
