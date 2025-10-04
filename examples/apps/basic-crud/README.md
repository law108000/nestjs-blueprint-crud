# Basic CRUD Example

A minimal showcase of the `nestjs-blueprint-crud` package covering standard CRUD flows, associations, and custom service composition.

## What it demonstrates

- Automatic CRUD controller wiring for the `User` and `Order` entities
- Association endpoints between users and orders
- Sails-style blueprint semantics (raw-array `replace`, non-destructive `remove`, and collection routing)
- Custom business logic layered on top of the generated base service
- Bootstrapping a NestJS application against MySQL using TypeORM

## Running locally

1. Install dependencies at the repository root:

```bash
npm install
```

2. Start the example database (defaults to MySQL on `localhost:3307`):

```bash
npm run db:start
```

3. Launch the example application:

```bash
DB_HOST=127.0.0.1 DB_PORT=3307 DB_USERNAME=root DB_PASSWORD=password DB_NAME=nestjs_crud_example npx ts-node -r tsconfig-paths/register examples/apps/basic-crud/src/main.ts
```

4. Explore the generated Swagger docs at `http://localhost:3000/api`.

5. Shut the database down when you are finished:

```bash
npm run db:stop
```

## Tests

- Repository-wide smoke coverage:

  ```bash
  npm run test:e2e
  ```

- Example-focused specs that live alongside the showcase code:

  ```bash
  npm run test:e2e -- --testPathPattern=examples/apps/basic-crud/test
  ```

  This suite is safe to extend with additional flows without impacting other showcases.

  The existing specs verify Waterline-style queries, `add/remove/replace` association flows, and the raw-array payloads required for Sails blueprint parity.

> The example test harness relies on the shared utilities in `examples/tooling/test-helpers.ts` for bootstrapping and table resets.
