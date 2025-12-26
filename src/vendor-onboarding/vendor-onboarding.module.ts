import { Module } from '@nestjs/common';
import { VendorOnboardingController } from './vendor-onboarding.controller';
import { VendorOnboardingService } from './vendor-onboarding.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [VendorOnboardingController],
  providers: [VendorOnboardingService, PrismaService],
  exports: [VendorOnboardingService],
})
export class VendorOnboardingModule {}
