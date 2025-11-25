import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Module, DynamicModule } from '@nestjs/common';
import { CrudEntity } from '../entities/base.entity';
import { CrudControllerModule } from './base-controller.module';

class TestEntity extends CrudEntity {
  name!: string;
}

@Module({})
class TestDatabaseModule {
  static forRoot(): DynamicModule {
    const mockRepository = {
      metadata: {
        name: 'TestEntity',
        relations: [],
        columns: [{ propertyPath: 'id' }, { propertyPath: 'name' }],
        findRelationWithPropertyPath: () => undefined,
        findColumnWithPropertyPath: () => ({}),
      },
      createQueryBuilder: () => ({
        andWhere: function () {
          return this;
        },
        orWhere: function () {
          return this;
        },
        leftJoinAndSelect: function () {
          return this;
        },
        take: function () {
          return this;
        },
        skip: function () {
          return this;
        },
        orderBy: function () {
          return this;
        },
        addOrderBy: function () {
          return this;
        },
        select: function () {
          return this;
        },
        getRawAndEntities: async () => ({ raw: [], entities: [] }),
        getCount: async () => 0,
      }),
      save: async () => ({}),
      update: async () => ({}),
      softDelete: async () => ({}),
      restore: async () => ({}),
      count: async () => 0,
    };

    return {
      module: TestDatabaseModule,
      global: true,
      providers: [
        { provide: 'DATABASE_CONNECTION', useValue: { getRepository: () => mockRepository } },
      ],
      exports: ['DATABASE_CONNECTION'],
    };
  }
}

describe('Swagger Query Parameters', () => {
  it('should define individual query parameters instead of a single "query" object', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestDatabaseModule.forRoot(),
        CrudControllerModule.forEntity({
          entity: TestEntity,
          prefix: 'test',
          tagName: 'Test',
        }),
      ],
    }).compile();

    const app = moduleRef.createNestApplication();

    const config = new DocumentBuilder().setTitle('Test API').setVersion('1.0').build();

    const document = SwaggerModule.createDocument(app, config);

    // Check the GET /test endpoint
    const getTestPath = document.paths['/test']?.get;

    expect(getTestPath).toBeDefined();

    const parameters = getTestPath?.parameters || [];
    const paramNames = parameters.map((p: any) => p.name);

    // Check that individual parameters are present (not 'query')
    const expectedParams = ['where', 'limit', 'skip', 'sort', 'select', 'omit', 'populate'];

    expect(paramNames).not.toContain('query');
    expectedParams.forEach(param => {
      expect(paramNames).toContain(param);
    });

    // Also check the count endpoint
    const getCountPath = document.paths['/test/count']?.get;
    expect(getCountPath).toBeDefined();

    const countParams = getCountPath?.parameters || [];
    const countParamNames = countParams.map((p: any) => p.name);

    expect(countParamNames).not.toContain('query');
    expect(countParamNames).toContain('where');

    await app.close();
  });
});
