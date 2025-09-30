import 'reflect-metadata';
import { Module, type DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BaseEntity } from '../entities/base.entity';
import { BaseService } from '../services/base.service';
import { WaterlineQueryService } from '../services/waterline-query.service';
import { BaseServiceModule, getBaseServiceInjectToken } from './base-service.module';
import {
  WaterlineQueryModule,
  getWaterlineQueryServiceInjectToken,
} from './waterline-query.module';
import { BaseControllerModule } from './base-controller.module';
import { BaseController } from '../controllers/base.controller';

class ExampleEntity extends BaseEntity {
  name!: string;
}

@Module({})
class DatabaseTestingModule {
  static withConnection(connection: any): DynamicModule {
    return {
      module: DatabaseTestingModule,
      global: true,
      providers: [{ provide: 'DATABASE_CONNECTION', useValue: connection }],
      exports: ['DATABASE_CONNECTION'],
    };
  }
}

describe('Dynamic modules', () => {
  let repository: any;
  let dataSource: any;

  beforeEach(() => {
    repository = {
      metadata: {
        name: 'ExampleEntity',
        relations: [],
        columns: [{ propertyPath: 'id' }, { propertyPath: 'name' }],
        findRelationWithPropertyPath: jest.fn(),
        findColumnWithPropertyPath: jest.fn().mockReturnValue({}),
      },
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
        getCount: jest.fn().mockResolvedValue(0),
      }),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
    };

    dataSource = {
      getRepository: jest.fn().mockReturnValue(repository),
    };
  });

  it('BaseServiceModule.forEntity should provide a BaseService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseTestingModule.withConnection(dataSource),
        BaseServiceModule.forEntity(ExampleEntity),
      ],
    }).compile();

    const service = moduleRef.get<BaseService<any>>(getBaseServiceInjectToken(ExampleEntity));

    expect(service).toBeInstanceOf(BaseService);
    expect(dataSource.getRepository).toHaveBeenCalledWith(ExampleEntity);

    await moduleRef.close();
  });

  it('WaterlineQueryModule.forEntity should expose WaterlineQueryService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseTestingModule.withConnection(dataSource),
        WaterlineQueryModule.forEntity(ExampleEntity),
      ],
    }).compile();

    const waterlineService = moduleRef.get<WaterlineQueryService<any>>(
      getWaterlineQueryServiceInjectToken(ExampleEntity),
    );

    expect(waterlineService).toBeInstanceOf(WaterlineQueryService);

    await moduleRef.close();
  });

  it('BaseControllerModule.forEntity should wire controller with service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseTestingModule.withConnection(dataSource),
        BaseControllerModule.forEntity({
          entity: ExampleEntity,
          prefix: 'examples',
          tagName: 'Examples',
        }),
      ],
    }).compile();

    const service = moduleRef.get<BaseService<any>>(getBaseServiceInjectToken(ExampleEntity));
    jest.spyOn(service, 'find').mockResolvedValue([]);

    const controller = moduleRef.get<BaseController<any>>(`${ExampleEntity.name}BaseController`);

    expect(controller).toBeInstanceOf(BaseController);

    await controller.find({} as any);

    expect(service.find).toHaveBeenCalled();

    await moduleRef.close();
  });
});
