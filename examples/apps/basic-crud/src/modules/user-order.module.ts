import { Module, Controller } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BaseAssociationController,
  BaseAssociationService,
  WaterlineQueryModule,
  WaterlineQueryService,
  getWaterlineQueryServiceInjectToken,
} from 'nestjs-blueprint-crud';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';

@Controller('users')
class UserOrdersController extends BaseAssociationController<User, Order> {
  constructor(baseAssociationService: BaseAssociationService<User, Order>) {
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
      provide: BaseAssociationService,
      useFactory: (
        userWaterlineQueryService: WaterlineQueryService<User>,
        orderWaterlineQueryService: WaterlineQueryService<Order>,
      ) => new BaseAssociationService(userWaterlineQueryService, orderWaterlineQueryService),
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
