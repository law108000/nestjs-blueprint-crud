import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserModule } from './modules/user.module';
import { OrderModule } from './modules/order.module';
import { UserOrderModule } from './modules/user-order.module';
import { User } from './entities/user.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'nestjs_crud_example',
      entities: [User, Order],
      synchronize: true, // Only use in development environment
      logging: true,
    }),
    OrderModule,
    UserModule,
    UserOrderModule,
  ],
  providers: [
    // Provide database connection for the package
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: DataSource,
    },
  ],
})
export class AppModule {}
