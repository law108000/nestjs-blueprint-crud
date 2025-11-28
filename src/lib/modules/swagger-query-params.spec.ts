import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Module, DynamicModule } from '@nestjs/common';
import { CrudEntity } from '../entities/base.entity';
import { CrudControllerModule } from './base-controller.module';
import { QueryProperty } from '../decorators/query-property.decorator';
import { SerializeProperty } from '../decorators/serialize-property.decorator';

class TestEntity extends CrudEntity {
  name!: string;
}

class OrderEntity extends CrudEntity {
  @QueryProperty({
    description: 'Order number',
    example: 'ORD-001',
  })
  @SerializeProperty({
    description: 'Order number',
  })
  orderNumber!: string;

  @QueryProperty({
    description: 'Order total amount',
    example: 100,
  })
  @SerializeProperty({
    description: 'Order total amount',
  })
  totalAmount!: number;

  @QueryProperty({
    description: 'Order status',
  })
  @SerializeProperty({
    description: 'Order status',
  })
  status!: string;

  @QueryProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Order owner',
  })
  @SerializeProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Order owner',
  })
  user?: unknown;
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
        andWhere() {
          return this;
        },
        orWhere() {
          return this;
        },
        leftJoinAndSelect() {
          return this;
        },
        take() {
          return this;
        },
        skip() {
          return this;
        },
        orderBy() {
          return this;
        },
        addOrderBy() {
          return this;
        },
        select() {
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

  it('should generate entity-specific examples for query parameters based on entity fields', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestDatabaseModule.forRoot(),
        CrudControllerModule.forEntity({
          entity: OrderEntity,
          prefix: 'orders',
          tagName: 'Orders',
        }),
      ],
    }).compile();

    const app = moduleRef.createNestApplication();

    const config = new DocumentBuilder().setTitle('Test API').setVersion('1.0').build();

    const document = SwaggerModule.createDocument(app, config);

    // Check the GET /orders endpoint
    const getOrdersPath = document.paths['/orders']?.get;

    expect(getOrdersPath).toBeDefined();

    const parameters = getOrdersPath?.parameters || [];

    // Find specific parameters and check their examples
    const whereParam = parameters.find((p: any) => p.name === 'where') as any;
    const sortParam = parameters.find((p: any) => p.name === 'sort') as any;
    const selectParam = parameters.find((p: any) => p.name === 'select') as any;
    const populateParam = parameters.find((p: any) => p.name === 'populate') as any;

    expect(whereParam).toBeDefined();
    expect(sortParam).toBeDefined();
    expect(selectParam).toBeDefined();
    expect(populateParam).toBeDefined();

    // Check that where example contains entity-specific field (orderNumber)
    const whereExample = whereParam?.schema?.example;
    expect(whereExample).toBeDefined();
    expect(whereExample).toContain('orderNumber');

    // Check that sort example contains entity-specific field
    const sortExample = sortParam?.schema?.example;
    expect(sortExample).toBeDefined();
    expect(sortExample).toContain('orderNumber');

    // Check that select example contains entity-specific fields
    const selectExample = selectParam?.schema?.example;
    expect(selectExample).toBeDefined();
    expect(selectExample).toContain('orderNumber');

    // Check that populate example contains the relation field 'user'
    const populateExample = populateParam?.schema?.example;
    expect(populateExample).toBeDefined();
    expect(populateExample).toContain('user');

    // Verify that hardcoded generic examples like "John" or "id,name,email" are NOT present
    expect(whereExample).not.toContain('John');
    expect(selectExample).not.toBe('id,name,email');
    expect(populateExample).not.toBe('user,category');

    await app.close();
  });
});
