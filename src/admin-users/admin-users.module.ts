import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { PrismaService } from '../prisma.service';
import { MailModule } from '../core/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, PrismaService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
