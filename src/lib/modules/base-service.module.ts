import { Module, type DynamicModule } from '@nestjs/common';
import type { BaseEntity } from '../entities/base.entity';
import { BaseService } from '../services/base.service';
import { getWaterlineQueryServiceInjectToken, WaterlineQueryModule } from './waterline-query.module';

export function getBaseServiceInjectToken<T extends BaseEntity>(entity: new () => T): string {
  return `${entity.name}BaseService`;
}

@Module({})
export class BaseServiceModule {
  static forEntity<T extends BaseEntity>(entity: new () => T): DynamicModule {
    return {
      module: BaseServiceModule,
      imports: [
        WaterlineQueryModule.forEntity(entity),
      ],
      providers: [
        {
          provide: `${entity.name}BaseService`,
          useFactory: (waterlineQueryService) => {
            return new BaseService<T>(waterlineQueryService);
          },
          inject: [getWaterlineQueryServiceInjectToken(entity)],
        }
      ],
      exports: [getBaseServiceInjectToken(entity)],
    };
  }
}