import { Module } from '@nestjs/common';
import { AdminContentController } from './admin-content.controller';
import { PublicContentController } from './public-content.controller';
import { HomeContentService } from './home-content.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CloudinaryModule, AuthModule],
  controllers: [AdminContentController, PublicContentController],
  providers: [HomeContentService, PrismaService],
  exports: [HomeContentService],
})
export class HomeContentModule {}
