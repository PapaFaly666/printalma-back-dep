import { Module, forwardRef } from '@nestjs/common';
import { OrangeMoneyController } from './orange-money.controller';
import { OrangeMoneyService } from './orange-money.service';
import { PrismaService } from '../prisma.service';
import { PaymentConfigModule } from '../payment-config/payment-config.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    PaymentConfigModule,
    forwardRef(() => OrderModule),
  ],
  controllers: [OrangeMoneyController],
  providers: [OrangeMoneyService, PrismaService],
  exports: [OrangeMoneyService],
})
export class OrangeMoneyModule {}
