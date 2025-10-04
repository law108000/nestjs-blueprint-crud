import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerModule } from 'nestjs-blueprint-crud';
import { Order } from '../entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CrudControllerModule.forEntity({
      entity: Order,
      prefix: 'orders',
      tagName: 'Orders',
      permissions: {
        list: true,
        count: true,
        get: true,
        create: true,
        update: true,
        delete: true,
      },
    }),
  ],
})
export class OrderModule {}
