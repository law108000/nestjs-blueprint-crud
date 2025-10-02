# Usage Examples

This directory contains complete usage examples for the `nestjs-blueprint-crud` package.

## File Structure

```
examples/
├── entities/           # Entity definitions
│   ├── user.entity.ts  # User entity
│   └── order.entity.ts # Order entity
├── modules/            # Module configurations
│   ├── order.module.ts      # Order CRUD module
│   ├── user.module.ts       # User CRUD module
│   └── user-order.module.ts # User-Order association module
├── services/           # Custom services
│   └── user.service.ts # Extended user service
├── app.module.ts       # Main application module
└── README.md          # Documentation
```

## Core Concepts

### 1. Entity Definition

Use decorators to mark entity property behaviors:

- `@CreateProperty()` - Mark properties required for creation
- `@UpdateProperty()` - Mark properties that can be modified during updates
- `@QueryProperty()` - Mark properties that can be queried
- `@SerializeProperty()` - Mark properties to include in output

### 2. Auto-Generated APIs

Each entity automatically generates the following endpoints:

**Basic CRUD:**

- `GET /users` - Query user list
- `GET /users/count` - User count statistics
- `GET /users/:id` - Query single user
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /orders` - Query order list
- `POST /orders` - Create order

**Bulk Operations:**

- `POST /users/bulk` - Bulk create
- `PATCH /users/bulk` - Bulk update
- `DELETE /users/bulk` - Bulk delete

**Association Operations:**

- `GET /users/:id/orders` - Query user orders
- `PUT /users/:id/orders/:fk` - Add order association
- `DELETE /users/:id/orders/:fk` - Remove order association

### 3. Query Syntax

Supports complex query conditions:

```javascript
// Basic query
GET /users?where={"name":"John"}

// Comparison operators
GET /users?where={"age":{">=":18,"<=":65}}

// Contains operator
GET /users?where={"name":{"contains":"John"}}

// Logical operators
GET /users?where={"and":[{"age":{">=":18}},{"status":"active"}]}

// Sorting and pagination
GET /users?sort=name ASC&limit=10&skip=0

// Field selection
GET /users?select=id,name,email

// Association queries
GET /users?populate=orders
```

## Practical Application Examples

### Creating Users

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-001",
    "totalAmount": 99.99,
    "status": "pending",
    "userId": 1
  }'
```

### Querying Active Users

```bash
curl "http://localhost:3000/users?where=%7B%22status%22%3A%22active%22%7D"
```

### Age Range Query

```bash
curl "http://localhost:3000/users?where=%7B%22age%22%3A%7B%22%3E%3D%22%3A18%2C%22%3C%3D%22%3A65%7D%7D"
```

### Bulk Update

```bash
curl -X PATCH http://localhost:3000/users/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "where": {"status": "inactive"},
    "data": {"status": "active"}
  }'
```

### Create Order and Associate with User

```bash
# 1. Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-001",
    "totalAmount": 99.99,
    "status": "pending",
    "user": 1
  }'

# 2. Or through association endpoint
curl -X PUT http://localhost:3000/users/1/orders/1
```

## Custom Extensions

See `services/user.service.ts` to learn how to compose the generated base service when adding custom business logic:

```typescript
// Custom business logic
const activeUsers = await userService.findActiveUsers();
const userStats = await userService.getUserStatistics();
```

## Running Examples

1. Install dependencies:

```bash
npm install
```

2. Start the MySQL service (runs on `localhost:3307` by default):

```bash
npm run db:start
```

3. Launch the example application with the provided bootstrap script:

```bash
 DB_HOST=127.0.0.1 DB_PORT=3307 DB_USERNAME=root DB_PASSWORD=password DB_NAME=nestjs_crud_example npx ts-node -r tsconfig-paths/register examples/main.ts
```

4. Access Swagger documentation:

```
http://localhost:3000/api
```

5. When finished, stop the database container:

```bash
npm run db:stop
```

### End-to-End Tests

The repository ships with E2E coverage that exercises the example modules against a live MySQL instance:

```bash
npm run test:e2e
```

The script automatically starts the Dockerized database, executes the Jest suite in-band, and tears the container down afterward.

## Important Notes

- The application expects a MySQL instance; use the provided Docker Compose file or supply equivalent connection variables
- The example modules import from the local `nestjs-blueprint-crud` source using TypeScript path mapping—adjust the imports to the published package name when consuming from npm
- In production environments, disable `synchronize: true` and manage migrations explicitly
