import { Module } from '@nestjs/common';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';
import { DesignProductLinkService } from './design-product-link.service';
import { PrismaService } from '../../prisma.service';
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
  controllers: [DesignController],
  providers: [DesignService, DesignProductLinkService, PrismaService],
  exports: [DesignService, DesignProductLinkService],
})
export class DesignModule {} 