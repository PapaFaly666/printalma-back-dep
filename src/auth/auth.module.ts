import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../core/mail/mail.module';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';

@Module({
  providers: [AuthService, PrismaService,JwtAuthGuard,JwtStrategy],
  controllers: [AuthController],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' }, // Correspond à la durée du cookie
    }),
    MailModule,
    CloudinaryModule,
  ]
})
export class AuthModule {}
