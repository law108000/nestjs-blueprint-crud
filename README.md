# nestjs-blueprint-crud

A comprehensive NestJS library for automatic CRUD operations with TypeORM, complex queries, and entity associations.

## Inspiration

This library is inspired by [SailsJS](https://sailsjs.com/) and its ecosystem, particularly:

- **[Waterline ORM](https://waterlinejs.org/)** - For the elegant and intuitive query syntax that made complex database operations simple and readable
- **[SailsJS Blueprint API](https://sailsjs.com/documentation/reference/blueprint-api)** - For the automatic REST API generation that eliminated boilerplate controller code

SailsJS was groundbreaking in its approach to rapid API development, providing automatic CRUD endpoints and a powerful query language out of the box. However, it lacks TypeScript support and has not been actively maintained in recent years.

This package brings the best concepts from Waterline's query syntax and SailsJS's blueprint controllers to the modern NestJS ecosystem, with full TypeScript support, decorators, and integration with TypeORM.

## Features

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
  BaseEntity, 
  CreateProperty, 
  UpdateProperty, 
  QueryProperty, 
  SerializeProperty 
} from 'nestjs-blueprint-crud';

@Entity()
export class User extends BaseEntity {
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

`BaseControllerModule` and `WaterlineQueryModule` resolve their repositories through a shared `DATABASE_CONNECTION` token. Expose it once at the application boundary and reuse it everywhere:

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
import { BaseControllerModule } from 'nestjs-blueprint-crud';
import { DatabaseModule } from '../database.module';
import { User } from './user.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    BaseControllerModule.forEntity({
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

### Basic CRUD Operations

```
GET    /users             # Query user list
GET    /users/count       # Count matching users
GET    /users/:id         # Retrieve a single user
POST   /users             # Create a user
PATCH  /users/:id         # Update a user
DELETE /users/:id         # Soft delete a user (if soft-delete is enabled)
POST   /users/bulk        # Bulk create (array body)
PATCH  /users/bulk?ids=1,2,3   # Bulk update by ID list
DELETE /users/bulk?ids=1,2,3   # Bulk delete by ID list
POST   /users/:id/restore # Restore a soft-deleted record
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
export class User extends BaseEntity {
  @OneToMany(() => Order, order => order.user)
  @SerializeProperty({ isEntity: true, entityName: 'Order' })
  orders: Order[];
}

@Entity()
export class Order extends BaseEntity {
  @ManyToOne(() => User, user => user.orders)
  @CreateProperty({ isTenantBaseEntity: true })
  @UpdateProperty({ isTenantBaseEntity: true })
  @QueryProperty({ isEntity: true, entityName: 'User' })
  @SerializeProperty({ isEntity: true, entityName: 'User' })
  user: User;
}
```

### Association Controller

```typescript
import { Controller, Module } from '@nestjs/common';
import {
  BaseAssociationController,
  BaseAssociationService,
  WaterlineQueryModule,
  WaterlineQueryService,
  getWaterlineQueryServiceInjectToken,
} from 'nestjs-blueprint-crud';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

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
        userQuery: WaterlineQueryService<User>,
        orderQuery: WaterlineQueryService<Order>,
      ) => new BaseAssociationService(userQuery, orderQuery),
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

### Auto-Generated Association Endpoints

```
GET    /users/:id/orders        # Query user's orders
GET    /users/:id/orders/count  # Count user's orders
PUT    /users/:id/orders/:fk    # Add order association
PUT    /users/:id/orders        # Replace all order associations
DELETE /users/:id/orders/:fk    # Remove order association
```

## Sails blueprint compatibility

This library mirrors the [Sails blueprint API](https://sailsjs.com/documentation/reference/blueprint-api) so you can migrate Waterline-style apps with minimal refactoring:

- **RESTful routes**: `find`, `findOne`, `create`, `update` (`PATCH`), and `destroy` (`DELETE`) are exposed at the conventional `/:modelIdentity` and `/:modelIdentity/:id` paths.
- **Association routes**: `populate`, `add`, `remove`, and `replace` follow the Sails signatures (`GET /:model/:id/:association`, `PUT /:model/:id/:association/:fk`, `DELETE /:model/:id/:association/:fk`, `PUT /:model/:id/:association`).
- **Raw array payloads**: The `replace` route accepts either `{ "ids": [...] }` _or_ a bare JSON array like `[1,2,3]`, matching the Sails shortcut syntax.
- **Non-destructive removals**: Removing a child from a collection unlinks the relation (it does not delete the record), mirroring `removeFromCollection` semantics.
- **Waterline-style queries**: All endpoints understand the `where`, `limit`, `skip`, `sort`, `populate`, `select`, and `omit` options familiar to Waterline.

These guarantees are covered by the example end-to-end suite so regressions against Sails behaviour are caught automatically.

## Custom Services

If you need custom business logic, inject the generated base service and compose new methods on top:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BaseService, getBaseServiceInjectToken } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(getBaseServiceInjectToken(User))
    private readonly baseService: BaseService<User>,
  ) {}

  async findActiveUsers(): Promise<User[]> {
    return this.baseService.find({
      where: { status: 'active' },
    });
  }

  async promoteToAdmin(userId: number): Promise<User> {
    return this.baseService.update(userId, { role: 'admin' });
  }
}
```

## Permission Control

You can control permissions for each operation at a granular level:

```typescript
BaseControllerModule.forEntity({
  entity: User,
  prefix: 'users',
  tagName: 'Users',
  permissions: {
    list: true,    // Allow list queries
    count: true,   // Allow count statistics
    get: true,     // Allow single queries
    create: false, // Disable creation
    update: true,  // Allow updates
    delete: false  // Disable deletion
  }
})
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