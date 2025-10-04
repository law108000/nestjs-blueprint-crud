import { Module, Controller } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CrudAssociationController,
  CrudAssociationService,
  WaterlineQueryModule,
  WaterlineQueryService,
  getWaterlineQueryServiceInjectToken,
} from 'nestjs-blueprint-crud';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';

@Controller('users')
class UserOrdersController extends CrudAssociationController<User, Order> {
  constructor(baseAssociationService: CrudAssociationService<User, Order>) {
    super(baseAssociationService, 'orders');
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    WaterlineQueryModule.forEntity(User),
    WaterlineQueryModule.forEntity(Order),
  ],
  controllers: [UserOrdersController],
  providers: [
    {
      provide: CrudAssociationService,
      useFactory: (
        userWaterlineQueryService: WaterlineQueryService<User>,
        orderWaterlineQueryService: WaterlineQueryService<Order>,
      ) => new CrudAssociationService(userWaterlineQueryService, orderWaterlineQueryService),
      inject: [
        getWaterlineQueryServiceInjectToken(User),
        getWaterlineQueryServiceInjectToken(Order),
      ],
    },
    {
      provide: 'ASSOCIATION_NAME',
      useValue: 'orders',
    },
  ],
})
export class UserOrderModule {}
