import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS
  app.enableCors();

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Asistencia API')
    .setDescription(
      'API REST para el sistema de control de asistencia de empleados con notificaciones automáticas por tardanzas. Incluye registro de entradas/salidas, consulta de asistencias y generación de reportes detallados.',
    )
    .setVersion('1.0')
    .addTag('attendance', 'Endpoints para registro y consulta de asistencias')
    .addServer('http://localhost:3000', 'Servidor de Desarrollo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api`);
}

void bootstrap();
