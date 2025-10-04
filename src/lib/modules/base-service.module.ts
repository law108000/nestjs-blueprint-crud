import { Module, type DynamicModule } from '@nestjs/common';
import type { CrudEntity } from '../entities/base.entity';
import { CrudService } from '../services/base.service';
import {
  getWaterlineQueryServiceInjectToken,
  WaterlineQueryModule,
} from './waterline-query.module';

export function getCrudServiceInjectToken<T extends CrudEntity>(entity: new () => T): string {
  return `${entity.name}CrudService`;
}

@Module({})
export class CrudServiceModule {
  static forEntity<T extends CrudEntity>(entity: new () => T): DynamicModule {
    return {
      module: CrudServiceModule,
      imports: [WaterlineQueryModule.forEntity(entity)],
      providers: [
        {
          provide: `${entity.name}CrudService`,
          useFactory: waterlineQueryService => {
            return new CrudService<T>(waterlineQueryService);
          },
          inject: [getWaterlineQueryServiceInjectToken(entity)],
        },
      ],
      exports: [getCrudServiceInjectToken(entity)],
    };
  }
}
