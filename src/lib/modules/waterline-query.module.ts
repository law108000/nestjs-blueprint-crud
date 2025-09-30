import { DynamicModule, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { WaterlineQueryService } from '../services/waterline-query.service';

export function getWaterlineQueryServiceInjectToken<T extends BaseEntity>(entity: new () => T): string {
  return `${entity.name}WaterlineQueryService`;
}

@Module({})
export class WaterlineQueryModule {
  static forEntity<T extends BaseEntity>(entity: new () => T): DynamicModule {
    return {
      module: WaterlineQueryModule,
      providers: [
        {
          provide: getWaterlineQueryServiceInjectToken(entity),
          useFactory: (dataSource: DataSource) => new WaterlineQueryService<T>(dataSource, entity),
          inject: ['DATABASE_CONNECTION'],
        },
      ],
      exports: [getWaterlineQueryServiceInjectToken(entity)],
    };
  }
}