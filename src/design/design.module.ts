import { Module } from '@nestjs/common';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';
import { DesignProductLinkService } from './design-product-link.service';
import { DesignAutoValidationService } from './design-auto-validation.service';
import { DesignAutoValidationController } from './design-auto-validation.controller';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';
import { MailModule } from '../core/mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CloudinaryModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DesignController, DesignAutoValidationController],
  providers: [DesignService, DesignProductLinkService, DesignAutoValidationService, PrismaService],
  exports: [DesignService, DesignProductLinkService, DesignAutoValidationService],
})
export class DesignModule {} 