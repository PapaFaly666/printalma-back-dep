import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService, 
    NotificationGateway, 
    PrismaService,
    {
      provide: 'NotificationGateway',
      useExisting: NotificationGateway,
    }
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {} 