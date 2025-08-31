import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from 'prisma.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { SizeService } from './size/size.service';
import { SizeController } from './size/size.controller';
import { SizeModule } from './size/size.module';
import { ColorModule } from './color/color.module';
import { ProductViewModule } from './product-view/product-view.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './core/mail/mail.module';
import { OrderModule } from './order/order.module';
import { NotificationModule } from './notification/notification.module';
import { DelimitationModule } from './delimitation/delimitation.module';
import { VendorProductModule } from './vendor-product/vendor-product.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { DesignModule } from './design/design.module';
import { ThemeModule } from './theme/theme.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DebugDesignMiddleware } from './core/middleware/debug-design.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ProductModule, 
    CategoryModule, 
    SizeModule, 
    ColorModule, 
    ProductViewModule, 
    AuthModule, 
    MailModule,
    OrderModule,
    NotificationModule,
    DelimitationModule,
    VendorProductModule,
    CloudinaryModule,
    DesignModule,
    ThemeModule
  ],
  controllers: [AppController, SizeController],
  providers: [AppService, PrismaService, SizeService],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DebugDesignMiddleware)
      .forRoutes('vendor/publish');
  }
}
