import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
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
import { CommissionModule } from './commission/commission.module';
import { DesignCategoryModule } from './design-category/design-category.module';
import { DesignerModule } from './designer/designer.module';
import { VendorOrdersModule } from './vendor-orders/vendor-orders.module';
import { VendorFundsModule } from './vendor-funds/vendor-funds.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DebugDesignMiddleware } from './core/middleware/debug-design.middleware';
import { VendorTypeModule } from './vendor-type/vendor-type.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { RolesModule } from './roles/roles.module';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { VariationModule } from './variation/variation.module';
import { PaytechModule } from './paytech/paytech.module';
import { PaydunyaModule } from './paydunya/paydunya.module';
import { PaymentModule } from './payment/payment.module';
import { CustomizationModule } from './customization/customization.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PublicUsersModule } from './public-users/public-users.module';
import { VendorGalleryModule } from './vendor-gallery/vendor-gallery.module';
import { VendorDesignRevenueModule } from './vendor-design-revenue/vendor-design-revenue.module';
import { SuperadminDashboardModule } from './superadmin-dashboard/superadmin-dashboard.module';
import { VendorOnboardingModule } from './vendor-onboarding/vendor-onboarding.module';
import { StickerModule } from './sticker/sticker.module';
import { HomeContentModule } from './home-content/home-content.module';
import { VendorPhoneModule } from './vendor-phone/vendor-phone.module';
import { PaymentConfigModule } from './payment-config/payment-config.module';
import { OrangeMoneyModule } from './orange-money/orange-money.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { VendorStatsModule } from './vendor-stats/vendor-stats.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ProductModule,
    CategoryModule,
    SubCategoryModule,
    VariationModule,
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
    ThemeModule,
    CommissionModule,
    DesignCategoryModule,
    DesignerModule,
    VendorOrdersModule,
    VendorFundsModule,
    VendorTypeModule,
    AdminUsersModule,
    RolesModule,
    PaymentConfigModule, // Module de configuration dynamique des paiements
    PaytechModule,
    PaydunyaModule,
    OrangeMoneyModule,
    PaymentModule,
    CustomizationModule,
    DeliveryModule,
    PublicUsersModule,
    VendorGalleryModule,
    VendorDesignRevenueModule,
    SuperadminDashboardModule,
    VendorOnboardingModule,
    StickerModule,
    HomeContentModule,
    VendorPhoneModule,
    AdminSettingsModule, // Module des paramètres administrateur
    VendorStatsModule, // Module des statistiques vendeur
    PermissionsModule, // Module de gestion des permissions et rôles
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
