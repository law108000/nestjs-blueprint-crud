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

### 1. Define Entity

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

### 2. Create Controller Module

```typescript
import { Module } from '@nestjs/common';
import { BaseControllerModule } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Module({
  imports: [
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
        delete: true
      }
    })
  ]
})
export class UserModule {}
```

### 3. Setup Database Connection

Provide database connection in your main module:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule
  ],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (dataSource) => dataSource,
      inject: ['DataSource']
    }
  ]
})
export class AppModule {}
```

## Auto-Generated API Endpoints

The package automatically generates the following endpoints for your entities:

### Basic CRUD Operations

```
GET    /users           # Query user list
GET    /users/count     # User count statistics
GET    /users/:id       # Query single user
POST   /users           # Create user
PATCH  /users/:id       # Update user
DELETE /users/:id       # Delete user
POST   /users/bulk      # Bulk create
PATCH  /users/bulk      # Bulk update
DELETE /users/bulk      # Bulk delete
POST   /users/:id/restore # Restore soft-deleted
```

### Query Parameters

```typescript
// GET /users?where={"name":"John"}&limit=10&skip=0&sort=name ASC
{
  "where": "{\\"name\\":\\"John\\",\\"age\\":{\\">=\\":18}}",
  "limit": 10,
  "skip": 0,
  "sort": "name ASC",
  "select": "id,name,email",
  "omit": "password",
  "populate": "profile,orders"
}
```

## Advanced Query Syntax

Supports rich query operators:

```javascript
// Comparison operators
{ "age": { ">": 18 } }          // Age greater than 18
{ "age": { ">=": 18, "<=": 65 } } // Age between 18-65

// Contains operators
{ "id": { "in": [1, 2, 3] } }   // ID in specified list
{ "name": { "contains": "John" } } // Name contains "John"
{ "email": { "startsWith": "admin" } } // Email starts with "admin"

// Logical operators
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
@Module({
  imports: [
    BaseAssociationControllerModule.forEntity({
      parentEntity: User,
      childEntity: Order,
      association: 'orders',
      prefix: 'users',
      suffix: 'orders',
      tagName: 'User Orders',
    })
  ]
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

## Custom Services

If you need custom business logic, you can extend the base service:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseService } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Injectable()
export class UserService extends BaseService<User> {
  async findActiveUsers(): Promise<User[]> {
    return this.find({
      where: { status: 'active' }
    });
  }

  async promoteToAdmin(userId: number): Promise<User> {
    return this.update(userId, { role: 'admin' });
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