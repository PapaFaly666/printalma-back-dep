import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MockupController } from './controllers/mockup.controller';
import { MockupService } from './services/mockup.service';
import { PrismaService } from 'prisma.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { DelimitationService } from '../delimitation/delimitation.service';
import { MailModule } from '../core/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [ProductController, MockupController],
  providers: [ProductService, MockupService, PrismaService, CloudinaryService, DelimitationService]
})
export class ProductModule {}
