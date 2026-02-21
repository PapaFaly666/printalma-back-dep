import { Module } from '@nestjs/common';
import { OrangeMoneyController } from './orange-money.controller';
import { OrangeMoneyService } from './orange-money.service';
import { PrismaService } from '../prisma.service';
import { PaymentConfigModule } from '../payment-config/payment-config.module';

@Module({
  imports: [PaymentConfigModule],
  controllers: [OrangeMoneyController],
  providers: [OrangeMoneyService, PrismaService],
  exports: [OrangeMoneyService],
})
export class OrangeMoneyModule {}
