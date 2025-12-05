# Using CrudController DTO Types

When extending `CrudController<Entity>` and overriding default endpoints, you can now easily access the DTO types in two ways:

## 1. Using Static Class References

Access DTO classes directly via static properties for creating instances:

```typescript
import { Controller } from '@nestjs/common';
import { CrudController, CrudEntity } from 'nestjs-blueprint-crud';

@Entity()
class User extends CrudEntity {
  @Column()
  name: string;

  @Column()
  email: string;
}

@Controller('users')
export class UserController extends CrudController<User> {
  // Create instances using static references
  @Get()
  async find(@Query() query?: typeof CrudController.ListQueryRequestDto) {
    const defaultQuery = new CrudController.ListQueryRequestDto();
    const finalQuery = query ?? defaultQuery;
    return super.find(finalQuery);
  }
}
```

## 2. Using Type Namespace (Recommended)

Access type definitions via the `CrudController` namespace for cleaner type annotations:

```typescript
import { Controller, Query, Body, Param } from '@nestjs/common';
import { CrudController, CrudEntity } from 'nestjs-blueprint-crud';

@Entity()
class Product extends CrudEntity {
  @Column()
  name: string;

  @Column()
  price: number;
}

@Controller('products')
export class ProductController extends CrudController<Product> {
  // Use namespace types in method signatures
  @Get()
  async find(@Query() query: CrudController.ListQueryRequest): Promise<Product[]> {
    // Add custom logic before calling parent
    console.log('Finding products with query:', query);
    return super.find(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query() query: CrudController.GetQueryRequest
  ): Promise<Product> {
    // Add custom logic
    return super.findOne(id, query);
  }

  @Post()
  async create(@Body() entity: CrudController.CreateRequest): Promise<Product> {
    // Add validation or transformation
    return super.create(entity);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() entity: CrudController.UpdateRequest
  ): Promise<Product> {
    // Add custom update logic
    return super.update(id, entity);
  }

  @Get('count')
  async count(@Query() query: CrudController.CountRequest): Promise<{ count: number }> {
    // Add custom counting logic
    return super.count(query);
  }
}
```

## Available Types

### Via Static Properties (for instantiation)
- `CrudController.ListQueryRequestDto` - For list/find queries
- `CrudController.GetQueryRequestDto` - For single entity queries
- `CrudController.CountRequestDto` - For count queries

### Via Namespace (for type annotations)
- `CrudController.ListQueryRequest` - For list/find queries
- `CrudController.GetQueryRequest` - For single entity queries  
- `CrudController.CountRequest` - For count queries
- `CrudController.CreateRequest` - For create operations
- `CrudController.UpdateRequest` - For update operations

## Benefits

1. **Type Safety**: Full TypeScript type checking when overriding methods
2. **Convenience**: No need to import DTO types separately
3. **Consistency**: All DTO types accessible from the same place
4. **Discoverability**: Easy to find available types through IDE autocomplete

## Migration from Direct Imports

Before:
```typescript
import { ListQueryParamsRequestDto, CreateRequestDto } from 'nestjs-blueprint-crud';

class MyController extends CrudController<MyEntity> {
  async find(@Query() query: ListQueryParamsRequestDto) { ... }
  async create(@Body() entity: CreateRequestDto) { ... }
}
```

After:
```typescript
import { CrudController } from 'nestjs-blueprint-crud';

class MyController extends CrudController<MyEntity> {
  async find(@Query() query: CrudController.ListQueryRequest) { ... }
  async create(@Body() entity: CrudController.CreateRequest) { ... }
}
```
