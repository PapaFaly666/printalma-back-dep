import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Configuration des limites de payload pour gérer les images base64
  // Limite générale pour JSON : 50MB (pour les images multiples en base64)
  app.use(bodyParser.json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      // Log pour monitoring des tailles de payload
      if (buf.length > 1024 * 1024) { // Si > 1MB
        console.log(`📊 Large payload received: ${(buf.length / 1024 / 1024).toFixed(2)}MB on ${req.path}`);
      }
    }
  }));
  
  // Limite pour les données URL-encoded
  app.use(bodyParser.urlencoded({ 
    limit: '50mb', 
    extended: true 
  }));

  // Configuration spéciale pour les routes de publication vendeur
  app.use('/vendor/publish', bodyParser.json({ 
    limit: '100mb', // Limite plus élevée pour la publication vendeur
    verify: (req: any, res, buf) => {
      console.log(`🚀 Vendor publish payload: ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
    }
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // Active la conversion implicite des types
    }
  }));

  const config = new DocumentBuilder()
    .setTitle('API Printalma')
    .setDescription('Documentation API pour la plateforme Printalma')
    .setVersion('1.0')
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('categories', 'Gestion des catégories de produits')
    .addTag('colors', 'Gestion des couleurs')
    .addTag('sizes', 'Gestion des tailles')
    .addTag('products', 'Gestion des produits')
    .addTag('designs', 'Gestion des designs vendeur')
    .addTag('vendor-publication', 'Publication de produits par les vendeurs')
    .addTag('orders', 'Gestion des commandes')
    .addTag('notifications', 'Système de notifications')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  app.enableCors({
    origin: [
      'http://localhost:5174',
      'https://printalma-website-dep.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true, // Important pour les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application running on port ${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api-docs`);
  console.log(`📊 Payload limits configured:`);
  console.log(`   - General JSON: 50MB`);
  console.log(`   - Vendor publish: 100MB`);
}
bootstrap();
