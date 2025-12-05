
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CrudServiceModule } from '../../src/lib/modules/base-service.module';
import { Product, ProductController } from '../../examples/extending-crud-controller.example';

const dbType = process.env.DB_TYPE ?? 'mysql';

const getTypeOrmConfig = () => {
  const baseConfig = {
    type: dbType as any,
    entities: [Product],
    synchronize: true,
    logging: false,
  };

  if (dbType === 'sqlite') {
    return {
      ...baseConfig,
      database: process.env.DB_NAME ?? ':memory:',
    };
  }

  return {
    ...baseConfig,
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME ?? 'nestjs_crud_example',
  };
};

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: DataSource,
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
class DatabaseProviderModule {}

describe('Extending Controller (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(getTypeOrmConfig()),
        DatabaseProviderModule,
        CrudServiceModule.forEntity(Product),
      ],
      controllers: [ProductController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Swagger Documentation', () => {
    it('should generate correct Swagger schema for extended controller', () => {
      const config = new DocumentBuilder()
        .setTitle('Test API')
        .setVersion('1.0')
        .build();
      const document = SwaggerModule.createDocument(app, config);

      const schemas = document.components?.schemas;
      expect(schemas).toBeDefined();
      
      // Find the schema that has the properties we defined
      const createDtoName = Object.keys(schemas!).find(key => key.includes('CreateDto') && key.includes('Product'));
      expect(createDtoName).toBeDefined();
      
      const createDto = schemas![createDtoName!];
      expect(createDto).toBeDefined();
      expect((createDto as any).properties).toHaveProperty('name');
      expect((createDto as any).properties).toHaveProperty('price');
      expect((createDto as any).properties.name).toHaveProperty('description', 'Product name');
    });
  });

  describe('Runtime Behavior', () => {
    it('should enforce custom validation logic in create()', async () => {
      // The example controller throws error if name < 3 chars
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'A', // Too short
          price: 100,
          description: 'Test product',
        })
        .expect(500); // The example throws a plain Error, which NestJS converts to 500 by default
    });

    it('should allow creation with valid data', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Valid Product',
          price: 100,
          description: 'Test product',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Valid Product');
          expect(res.body.id).toBeDefined();
        });
    });

    it('should enforce custom validation logic in update()', async () => {
      // Create a product first
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'To Update',
          price: 100,
          description: 'Test product',
        })
        .expect(201);

      const { id } = createRes.body;

      // Try to set negative price (forbidden by custom logic)
      await request(app.getHttpServer())
        .patch(`/products/${id}`)
        .send({
          price: -50,
        })
        .expect(500);
    });
  });
});
