import { Module } from '@nestjs/common';
import { UserModule } from './modules/user.module';
import { OrderModule } from './modules/order.module';
import { UserOrderModule } from './modules/user-order.module';
import { DatabaseModule } from './modules/database.module';

@Module({
  imports: [DatabaseModule, OrderModule, UserModule, UserOrderModule],
})
export class AppModule {}
