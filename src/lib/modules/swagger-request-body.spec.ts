import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Module, DynamicModule } from '@nestjs/common';
import { Column, Entity } from 'typeorm';
import { CrudEntity } from '../entities/base.entity';
import { CrudControllerModule } from './base-controller.module';
import { CreateProperty, UpdateProperty } from '../decorators/create-update-property.decorator';
import { SerializeProperty } from '../decorators/serialize-property.decorator';

@Entity('test_entities')
class TestEntity extends CrudEntity {
  @Column()
  @CreateProperty({ description: 'Test name', example: 'Test' })
  @UpdateProperty({ description: 'Test name', example: 'Updated Test' })
  @SerializeProperty({ description: 'Test name' })
  name!: string;

  @Column()
  @CreateProperty({ description: 'Test email', example: 'test@example.com' })
  @UpdateProperty({ description: 'Test email', example: 'updated@example.com' })
  @SerializeProperty({ description: 'Test email' })
  email!: string;
}

@Module({})
class TestDatabaseModule {
  static forRoot(): DynamicModule {
    const mockRepository = {
      metadata: {
        name: 'TestEntity',
        relations: [],
        columns: [{ propertyPath: 'id' }, { propertyPath: 'name' }, { propertyPath: 'email' }],
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

describe('Swagger Request Body', () => {
  it('should define requestBody for POST endpoint', async () => {
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

    // Check the POST /test endpoint
    const postTestPath = document.paths['/test']?.post;

    expect(postTestPath).toBeDefined();

    // Verify requestBody is defined
    expect(postTestPath?.requestBody).toBeDefined();

    // Check that requestBody has content with application/json
    const requestBody = postTestPath?.requestBody as {
      content: { 'application/json': { schema: Record<string, unknown> } };
    };
    expect(requestBody?.content?.['application/json']).toBeDefined();
    expect(requestBody?.content?.['application/json']?.schema).toBeDefined();

    // The schema should reference the CreateDto
    const schema = requestBody?.content?.['application/json']?.schema;
    expect(schema).toBeDefined();

    // Verify the CreateDto is in components/schemas
    expect(document.components?.schemas?.['TestEntityCreateDto']).toBeDefined();

    await app.close();
  });

  it('should define requestBody for PATCH endpoint', async () => {
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

    // Check the PATCH /test/:id endpoint
    const patchTestPath = document.paths['/test/{id}']?.patch;

    expect(patchTestPath).toBeDefined();

    // Verify requestBody is defined
    expect(patchTestPath?.requestBody).toBeDefined();

    // Check that requestBody has content with application/json
    const requestBody = patchTestPath?.requestBody as {
      content: { 'application/json': { schema: Record<string, unknown> } };
    };
    expect(requestBody?.content?.['application/json']).toBeDefined();
    expect(requestBody?.content?.['application/json']?.schema).toBeDefined();

    // The schema should reference the UpdateDto
    const schema = requestBody?.content?.['application/json']?.schema;
    expect(schema).toBeDefined();

    // Verify the UpdateDto is in components/schemas
    expect(document.components?.schemas?.['TestEntityUpdateDto']).toBeDefined();

    await app.close();
  });

  it('should define requestBody for PATCH bulk endpoint', async () => {
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

    // Check the PATCH /test/bulk endpoint
    const patchBulkPath = document.paths['/test/bulk']?.patch;

    expect(patchBulkPath).toBeDefined();

    // Verify requestBody is defined
    expect(patchBulkPath?.requestBody).toBeDefined();

    // Check that requestBody has content with application/json
    const requestBody = patchBulkPath?.requestBody as {
      content: { 'application/json': { schema: Record<string, unknown> } };
    };
    expect(requestBody?.content?.['application/json']).toBeDefined();
    expect(requestBody?.content?.['application/json']?.schema).toBeDefined();

    await app.close();
  });
});
