# NestJS Blueprint CRUD

<div align="center">
  <a href="https://www.npmjs.com/package/nestjs-blueprint-crud"><img src="https://img.shields.io/npm/v/nestjs-blueprint-crud" alt="NPM Version" /></a>
  <a href="https://github.com/law108000/nestjs-blueprint-crud/actions/workflows/ci.yml"><img src="https://github.com/law108000/nestjs-blueprint-crud/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/law108000/nestjs-blueprint-crud"><img src="https://codecov.io/gh/law108000/nestjs-blueprint-crud/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://github.com/law108000/nestjs-blueprint-crud/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node.js Version" />
  <a href="https://bundlephobia.com/package/nestjs-blueprint-crud"><img src="https://img.shields.io/bundlephobia/min/nestjs-blueprint-crud" alt="Bundle Size" /></a>
</div>

A NestJS library that brings Sails.js blueprint concepts and compatibility to the contemporary ecosystem with full TypeScript support.

> If you find this library helpful, please consider giving it a ⭐ on [GitHub](https://github.com/law108000/nestjs-blueprint-crud)!

## Inspiration

This library draws inspiration from [SailsJS](https://sailsjs.com/) and its blueprint API, bringing the concept of automatic CRUD generation to the modern [NestJS](https://nestjs.com/) ecosystem with full TypeScript support and contemporary development practices.

I used Sails.js for several years, but i decided to migrate to NestJS due to evolving business needs. The migration path was quite painful, so I developed and published this package to help others who might face similar challenges.

## Enhancements over Sails.js Blueprints

This NestJS implementation goes beyond the original Sails.js blueprint concept by providing significant improvements:

| Feature                           | Sails.js Support                                                | NestJS Blueprint CRUD Enhancements                                                                    |
| --------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Basic CRUD Operations**         | ✅ Supported (find, findOne, create, update, destroy)           | ✅ Supported + Enhanced with TypeScript types, additional endpoints (count, bulk operations, restore) |
| **Query Parameters**              | ✅ Supported (where, limit, skip, sort, select, omit, populate) | ✅ Supported + Enhanced validation, additional operators, and type safety                             |
| **Association Operations**        | ✅ Supported (add, remove, replace)                             | ✅ Supported + Improved type safety, additional endpoints (count)                                     |
| **TypeScript Support**            | ❌ Not native (JavaScript-based)                                | ✅ Full TypeScript support with interfaces, generics, and compile-time checks                         |
| **Database ORM**                  | Waterline                                                       | TypeORM (modern, high-performance alternative with better optimization and migration support)         |
| **Decorator-Driven Architecture** | ❌ Limited                                                      | ✅ Fine-grained control with property decorators and unified CrudProperty decorator                   |
| **API Documentation**             | ❌ Manual setup required                                        | ✅ Automatic Swagger/OpenAPI documentation generation                                                 |

## Database Support

This library supports multiple databases through TypeORM, with comprehensive testing across all supported platforms:

| Database       | Status       | Testing      | Notes                                          |
| -------------- | ------------ | ------------ | ---------------------------------------------- |
| **MySQL**      | ✅ Supported | ✅ E2E Tests | Full feature support with Docker-based testing |
| **PostgreSQL** | ✅ Supported | ✅ E2E Tests | Full feature support with Docker-based testing |
| **SQLite**     | ✅ Supported | ✅ E2E Tests | Full feature support with file-based testing   |
| **MongoDB**    | ✅ Supported | ✅ Ready     | Full feature support with Docker-based testing |

> **Note**: All databases are tested with the same comprehensive test suite to ensure feature parity and reliability.

## Installation

```bash
npm install nestjs-blueprint-crud
# or
yarn add nestjs-blueprint-crud
```

### CrudProperty Decorator

The `CrudProperty` decorator provides a unified way to configure properties for all CRUD operations, reducing redundancy:

```typescript
@CrudProperty({ description: 'User name' }) // Enables all operations by default
name: string;

@CrudProperty({
  description: 'Email address',
  create: { required: true },  // Custom create options
  update: { required: false }, // Custom update options
  query: true,                  // Enable querying
  serialize: true               // Include in responses
})
email: string;

@CrudProperty({
  description: 'Age',
  create: false,  // Disable creation
  update: true,   // Allow updates only
  query: true,    // Allow filtering
  serialize: true // Include in responses
})
age?: number;
```

**Operation Control:**

- `create`: `boolean | CreateUpdatePropertyOptions` - Controls create operations
- `update`: `boolean | CreateUpdatePropertyOptions` - Controls update operations
- `query`: `boolean | QueryPropertyOptions` - Controls query/filtering operations
- `serialize`: `boolean | SerializePropertyOptions` - Controls response serialization

**Entity Relationships:**

```typescript
@CrudProperty({
  description: 'User ID',
  isEntity: true,
  entityName: 'User'
})
user: User;
```

**Backward Compatibility:** The individual decorators (`CreateProperty`, `UpdateProperty`, `QueryProperty`, `SerializeProperty`) are still supported for existing code.

## Quick Start

### 1. Install the library

Follow the steps in [Installation](#installation) to add the package and required peer dependencies.

### 2. Define an entity

```typescript
import { Entity, Column } from 'typeorm';
import { CrudEntity, CrudProperty } from 'nestjs-blueprint-crud';

@Entity()
export class User extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'User name' })
  name: string;

  @Column()
  @CrudProperty({
    description: 'Email address',
    create: { required: true },
    update: { required: false },
    query: true,
    serialize: true,
  })
  email: string;

  @Column({ nullable: true })
  @CrudProperty({
    description: 'Age',
    required: false,
    create: false,
    update: true,
    query: true,
    serialize: true,
  })
  age?: number;
}
```

`CrudEntity` automatically provides `id`, `createdAt`, `updatedAt`, and `deletedAt` fields with TypeORM's automatic timestamp management.

### Customizing or Disabling Timestamp Fields

You can customize timestamp field names or disable them entirely by overriding the properties in your entity:

#### Custom timestamp field names:

```typescript
import { Entity, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { CrudEntity, CrudProperty } from 'nestjs-blueprint-crud';

@Entity()
export class CustomUser extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'User name' })
  name: string;

  // Override default timestamp fields with custom names
  @CreateDateColumn({
    name: 'created_at',
    comment: 'Record creation timestamp'
  })
  createdAt!: number; // Same property name, custom column name

  @UpdateDateColumn({
    name: 'updated_at',
    comment: 'Record update timestamp'
  })
  updatedAt!: number;

  @DeleteDateColumn({
    name: 'deleted_at',
    comment: 'Soft delete timestamp'
  })
  deletedAt?: number | null;
}
````

#### Disable timestamps entirely:

```typescript
import { Entity, Column } from 'typeorm';
import { CrudEntity, CrudProperty } from 'nestjs-blueprint-crud';

@Entity()
export class SimpleEntity extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'Entity name' })
  name: string;

  // Override timestamp properties without decorators to disable them
  createdAt?: never;
  updatedAt?: never;
  deletedAt?: never;
}
```

**Note:** When you override timestamp properties with the same names but different decorators, TypeORM will use your custom decorators instead of the base class defaults.

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
  @CrudProperty({
    description: 'User ID',
    isEntity: true,
    entityName: 'User',
  })
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
import { Injectable } from '@nestjs/common';
import { CrudService, InjectCrudService } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectCrudService(User)
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

> **Note**: The `@InjectCrudService(User)` decorator is a convenience wrapper around `@Inject(getCrudServiceInjectToken(User))` for cleaner syntax.

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

### Community Discussions

We encourage community engagement through GitHub Discussions! Join the conversation to:

- Ask questions about usage and implementation
- Share your ideas and feature requests
- Discuss best practices and integrations
- Get help from the community and maintainers

Start a discussion [here](https://github.com/law108000/nestjs-blueprint-crud/discussions) if you have questions or suggestions.

## License

MIT License
