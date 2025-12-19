import { Module } from '@nestjs/common';
import { DesignRevenueController } from './design-revenue.controller';
import { DesignRevenueService } from '../services/designRevenueService';
import { PrismaService } from '../prisma.service';
import { PayoutProcessingJob } from '../jobs/payoutProcessingJob';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
  ],
  controllers: [DesignRevenueController],
  providers: [
    DesignRevenueService,
    PrismaService,
    PayoutProcessingJob,
  ],
  exports: [DesignRevenueService],
})
export class VendorDesignRevenueModule {}