import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
// somewhere in your initialization file

async function start() {
  try {
    const PORT = process.env.API_PORT || 3033;
    console.log(`Server is starting at port: ${PORT}`);
    
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    const config = new DocumentBuilder()
      .setTitle('Fitness project')
      .setDescription('Fitness project REST API')
      .setVersion('1.0')
      .addTag(
        'NESTJS, validation, swagger, guard, pg, mailer, bot, sms, deploy-server, OTP',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(PORT, () => {
      console.log(`Server started at: ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

start();
