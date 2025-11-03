import { Module } from '@nestjs/common';
import { DesignerController } from './designer.controller';
import { DesignerService } from './designer.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CloudinaryModule, AuthModule],
  controllers: [DesignerController],
  providers: [DesignerService, PrismaService],
  exports: [DesignerService],
})
export class DesignerModule {}
