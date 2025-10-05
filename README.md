# nestjs-blueprint-crud

<div align="center">
  <a href="https://www.npmjs.com/package/nestjs-blueprint-crud"><img src="https://img.shields.io/npm/v/nestjs-blueprint-crud" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nestjs-blueprint-crud"><img src="https://img.shields.io/npm/dm/nestjs-blueprint-crud" alt="NPM Downloads" /></a>
  <a href="https://github.com/law108000/nestjs-blueprint-crud/actions/workflows/ci.yml"><img src="https://github.com/law108000/nestjs-blueprint-crud/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/law108000/nestjs-blueprint-crud"><img src="https://codecov.io/gh/law108000/nestjs-blueprint-crud/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://github.com/law108000/nestjs-blueprint-crud/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="MIT License" /></a>
</div>

A comprehensive NestJS library for automatic CRUD operations with TypeORM, complex queries, and entity associations.

## Inspiration

This library draws inspiration from [SailsJS](https://sailsjs.com/) and its blueprint API, bringing the concept of automatic CRUD generation to the modern NestJS ecosystem with full TypeScript support and contemporary development practices.

I used Sails.js for several years, but i decided to migrate to another NestJS library due to evolving business needs. The migration path was quite painful, so I developed and published this package to help others who might face similar challenges.

## Enhancements over Sails.js Blueprints

This NestJS implementation goes beyond the original Sails.js blueprint concept by providing significant improvements:

🛡️ **Full TypeScript Support**: Complete type safety with TypeScript interfaces, generics, and compile-time checks - no more runtime JavaScript errors.

🎯 **NestJS Ecosystem Integration**: Seamlessly integrates with NestJS modules, dependency injection, guards, interceptors, pipes, and middleware for enterprise-grade applications.

⚡ **TypeORM Integration**: Uses the modern, high-performance TypeORM instead of Waterline, providing better query optimization, migration support, and database compatibility.

🎨 **Decorator-Driven Architecture**: Fine-grained control over API behavior using property decorators (`@CreateProperty`, `@UpdateProperty`, `@QueryProperty`, `@SerializeProperty`) for each field.

📚 **Automatic Swagger Documentation**: Built-in OpenAPI/Swagger documentation generation with proper request/response models, validation schemas, and interactive API testing.

🔐 **Advanced Permission Control**: Granular permission settings per CRUD operation, enabling sophisticated access control patterns.

🔄 **Soft Deletes & Bulk Operations**: Support for soft deletes, bulk create/update/delete operations, and record restoration - features not available in basic Sails blueprints.

🧪 **Comprehensive Testing**: Includes unit tests, integration tests, and end-to-end test suites with Jest, ensuring reliability and compatibility.

🔧 **Modern Async/Await**: Leverages contemporary JavaScript async patterns without callback hell.

📊 **Enhanced Query Capabilities**: Advanced filtering, sorting, pagination, and association loading with TypeORM's powerful query builder.

🛠️ **Extensibility**: Easy to extend and customize with dependency injection, allowing composition of custom business logic on top of generated services.

🎪 **Validation & Serialization**: Integrated request/response validation and transformation using class-validator and class-transformer.

🚀 **Automatic CRUD**: Auto-generate complete REST API endpoints  
🔍 **Complex Queries**: Support advanced query syntax with operators, sorting, and pagination  
🔗 **Association Management**: Complete entity relationship operation support  
🎨 **Decorator-Driven**: Use decorators to define API behavior  
📚 **Swagger Integration**: Automatic API documentation generation  
🛡️ **Type Safety**: Full TypeScript support  
🎯 **Permission Control**: Fine-grained operation permission settings

## Installation

```bash
npm install nestjs-blueprint-crud
# or
yarn add nestjs-blueprint-crud
```

### Peer Dependencies

Make sure to install the following peer dependencies:

```bash
npm install @nestjs/common @nestjs/core @nestjs/swagger typeorm class-transformer class-validator reflect-metadata
```

## Quick Start

### 1. Install the library

Follow the steps in [Installation](#installation) to add the package and required peer dependencies.

### 2. Define an entity

```typescript
import { Entity, Column } from 'typeorm';
import {
  CrudEntity,
  CreateProperty,
  UpdateProperty,
  QueryProperty,
  SerializeProperty,
} from 'nestjs-blueprint-crud';

@Entity()
export class User extends CrudEntity {
  @Column()
  @CreateProperty({ description: 'User name' })
  @UpdateProperty({ description: 'User name' })
  @QueryProperty({ description: 'User name' })
  @SerializeProperty({ description: 'User name' })
  name: string;

  @Column()
  @CreateProperty({ description: 'Email address' })
  @UpdateProperty({ description: 'Email address' })
  @QueryProperty({ description: 'Email address' })
  @SerializeProperty({ description: 'Email address' })
  email: string;

  @Column({ nullable: true })
  @CreateProperty({ description: 'Age', required: false })
  @UpdateProperty({ description: 'Age', required: false })
  @QueryProperty({ description: 'Age' })
  @SerializeProperty({ description: 'Age' })
  age?: number;
}
```

### 3. Provide a database connection

`CrudControllerModule` and `WaterlineQueryModule` resolve their repositories through a shared `DATABASE_CONNECTION` token. Expose it once at the application boundary and reuse it everywhere:

```typescript
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'test',
      entities: [User],
      synchronize: true, // Development only
    }),
  ],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: DataSource,
    },
  ],
  exports: ['DATABASE_CONNECTION', TypeOrmModule],
})
export class DatabaseModule {}
```

### 4. Register a controller module for the entity

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerModule } from 'nestjs-blueprint-crud';
import { DatabaseModule } from '../database.module';
import { User } from './user.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    CrudControllerModule.forEntity({
      entity: User,
      prefix: 'users',
      tagName: 'Users',
      permissions: {
        list: true,
        count: true,
        get: true,
        create: true,
        update: true,
        delete: true,
      },
    }),
  ],
})
export class UserModule {}
```

### 5. Wire everything together

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
})
export class AppModule {}
```

## Auto-Generated API Endpoints

The package automatically generates the following endpoints for your entities:

### Core CRUD Operations (Sails.js Blueprint Compatible)

These endpoints maintain full compatibility with Sails.js blueprint API:

```
GET    /users             # Query user list (find)
GET    /users/:id         # Retrieve a single user (findOne)
POST   /users             # Create a user (create)
PATCH  /users/:id         # Update a user (update)
DELETE /users/:id         # Soft delete a user (destroy)
```

### Enhanced CRUD Operations (Extended Features)

Additional endpoints that extend beyond basic Sails.js blueprints:

```
GET    /users/count       # Count matching users (enhanced)
POST   /users/bulk        # Bulk create multiple users (extended)
PATCH  /users/bulk?ids=1,2,3   # Bulk update by ID list (extended)
DELETE /users/bulk?ids=1,2,3   # Bulk delete by ID list (extended)
POST   /users/:id/restore # Restore a soft-deleted record (extended)
```

### Query Parameters

All list endpoints accept Waterline-style criteria encoded as query params. Example:

```
GET /users?where=%7B%22name%22%3A%22John%22%2C%22age%22%3A%7B%22%3E%3D%22%3A18%7D%7D&limit=10&skip=0&sort=name%20ASC&select=id,name,email&omit=password&populate=profile,orders
```

`ListQueryParamsRequestDto` understands the following keys:

- `where` — JSON string representing Waterline-style criteria
- `limit`, `skip` — pagination controls
- `sort` — e.g. `createdAt DESC`
- `select`, `omit` — comma-separated projection controls
- `populate` — comma-separated relations to eager load

## Advanced Query Syntax

Supports rich operators and logical groupings:

```json
{ "age": { ">": 18 } }
{ "age": { ">=": 18, "<=": 65 } }
{ "id": { "in": [1, 2, 3] } }
{ "name": { "contains": "John" } }
{ "email": { "startsWith": "admin" } }
```

```json
{
  "and": [
    { "age": { ">": 18 } },
    { "status": "active" }
  ]
}

{
  "or": [
    { "name": { "contains": "John" } },
    { "email": { "contains": "john" } }
  ]
}
```

## Association Operations

### Define Associations

```typescript
@Entity()
export class User extends CrudEntity {
  @OneToMany(() => Order, order => order.user)
  @SerializeProperty({ isEntity: true, entityName: 'Order' })
  orders: Order[];
}

@Entity()
export class Order extends CrudEntity {
  @ManyToOne(() => User, user => user.orders)
  @CreateProperty({ isTenantCrudEntity: true })
  @UpdateProperty({ isTenantCrudEntity: true })
  @QueryProperty({ isEntity: true, entityName: 'User' })
  @SerializeProperty({ isEntity: true, entityName: 'User' })
  user: User;
}
```

### Association Controller

```typescript
import { Controller, Module } from '@nestjs/common';
import {
  CrudAssociationController,
  CrudAssociationService,
  WaterlineQueryModule,
  WaterlineQueryService,
  getWaterlineQueryServiceInjectToken,
} from 'nestjs-blueprint-crud';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

@Controller('users')
class UserOrdersController extends CrudAssociationController<User, Order> {
  constructor(crudAssociationService: CrudAssociationService<User, Order>) {
    super(crudAssociationService, 'orders');
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
        userQuery: WaterlineQueryService<User>,
        orderQuery: WaterlineQueryService<Order>,
      ) => new CrudAssociationService(userQuery, orderQuery),
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
```

### Core Association Endpoints (Sails.js Blueprint Compatible)

Standard association operations that mirror Sails.js blueprint behavior:

```
GET    /users/:id/orders        # Query user's orders (populate)
PUT    /users/:id/orders/:fk    # Add order association (add)
PUT    /users/:id/orders        # Replace all order associations (replace)
DELETE /users/:id/orders/:fk    # Remove order association (remove)
```

### Enhanced Association Endpoints (Extended Features)

Additional association operations with improved functionality:

```
GET    /users/:id/orders/count  # Count user's orders (enhanced)
```

## Sails.js Blueprint Compatibility

While this library maintains API compatibility with Sails.js blueprints for easy migration, it significantly enhances the original concept:

**Migration-Friendly Design**: Existing Sails.js applications can migrate with minimal refactoring, as the core API patterns and query syntax are preserved.

**Enhanced RESTful Routes**: All standard blueprint routes are supported with additional modern endpoints:

- Standard CRUD: `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`
- Advanced operations: `GET /users/count`, bulk operations, soft delete restoration
- Association management: Full support for relationship operations with improved type safety

**Waterline-Style Queries**: Maintains the familiar query syntax (`where`, `limit`, `skip`, `sort`, `populate`, `select`, `omit`) while adding TypeScript type checking and validation.

**Association Routes**: Complete support for relationship operations (`GET /users/:id/orders`, `PUT /users/:id/orders/:fk`, etc.) with enhanced error handling and validation.

**Backward Compatibility**: The library includes comprehensive end-to-end tests ensuring regressions against Sails.js behavior are caught automatically, while adding modern features that don't break existing functionality.

## Custom Services

If you need custom business logic, inject the generated base service and compose new methods on top:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { CrudService, getCrudServiceInjectToken } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(getCrudServiceInjectToken(User))
    private readonly crudService: CrudService<User>,
  ) {}

  async findActiveUsers(): Promise<User[]> {
    return this.crudService.find({
      where: { status: 'active' },
    });
  }

  async promoteToAdmin(userId: number): Promise<User> {
    return this.crudService.update(userId, { role: 'admin' });
  }
}
```

## Permission Control

You can control permissions for each operation at a granular level:

```typescript
CrudControllerModule.forEntity({
  entity: User,
  prefix: 'users',
  tagName: 'Users',
  permissions: {
    list: true, // Allow list queries
    count: true, // Allow count statistics
    get: true, // Allow single queries
    create: false, // Disable creation
    update: true, // Allow updates
    delete: false, // Disable deletion
  },
});
```

## Swagger Documentation

The package automatically generates Swagger documentation for all endpoints, including:

- Request/Response models
- Query parameter descriptions
- Operation descriptions and tags
- Error response definitions

## Complete Example

Check the `examples/` directory for complete usage examples, including:

- Basic CRUD operations
- Complex association relationships
- Custom business logic
- Permission control
- Test cases

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License
