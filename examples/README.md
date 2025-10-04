# Example Workspace

This directory hosts runnable applications and short-lived reproductions that demonstrate different features of `nestjs-blueprint-crud`.

## Directory layout

```
examples/
├── apps/                     # Long-lived, documented showcase apps
│   └── basic-crud/                # Current flagship example
│       ├── README.md
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── entities/
│       │   ├── main.ts
│       │   ├── modules/
│       │   └── services/
│       ├── test/
│       │   └── basic-crud.e2e-spec.ts
│       └── tsconfig.json
├── shared/                        # Reusable entities, fixtures, configs, …
│   ├── README.md
│   ├── config/
│   ├── entities/
│   └── seeders/
├── tooling/                       # Shared tooling & helpers for all showcases
│   ├── jest.base.config.js
│   ├── test-helpers.ts
│   └── tsconfig.base.json
└── tsconfig.json                  # Workspace-level configuration
```

> Import modules and services directly from `apps/<scenario>/src/**`. Root-level shims were removed to keep reuse paths explicit.

## Managing multiple scenarios

1. **Create a new app:** copy `apps/basic-crud` into `apps/<scenario-name>` and tailor the modules/entities. Keep each app self-contained within its `src` directory.
2. **Share code intentionally:** place reusable assets in `shared/` and import them via the `@examples/shared/*` path alias defined by each scenario’s `tsconfig.json` (see `apps/basic-crud/tsconfig.json`).
3. **Capture reproductions:** open a dated folder under `repros/` (for example, `repros/2025-10-03-user-sort/`) with a short README that outlines steps to reproduce, expected vs actual behaviour, and clean-up notes. Remove or archive folders once the fix lands.
4. **Centralize configuration:** extend `tooling/tsconfig.base.json` and `tooling/jest.base.config.js` from each example so TypeScript and Jest stay in sync across scenarios.

## Running an example

```bash
# Install dependencies at the repo root
npm install

# Start the shared MySQL test container (defaults to localhost:3307)
npm run db:start

# Launch the desired example (basic CRUD shown)
DB_HOST=127.0.0.1 \
DB_PORT=3307 \
DB_USERNAME=root \
DB_PASSWORD=password \
DB_NAME=nestjs_crud_example \
npx ts-node -r tsconfig-paths/register examples/apps/basic-crud/src/main.ts

# Tear everything down when finished
npm run db:stop
```

> Want Swagger UI? Add the standard NestJS Swagger bootstrap to the example’s `main.ts` (for instance, call `SwaggerModule.setup('api', app, document)` after creating the app). The controllers already publish the required OpenAPI metadata.

## Testing

- Repository-wide checks (library smoke tests and aggregator example):

  ```bash
  npm run test:e2e
  ```

- Example-focused suites live in `examples/apps/<scenario>/test`. They are picked up automatically by the same Jest run, or you can scope to a single showcase:

  ```bash
  npm run test:e2e -- --testPathPattern=examples/apps/basic-crud/test
  ```

  Use the scenario directory in the `--testPathPattern` flag to target other showcases.
  The Basic CRUD specs lock in Sails blueprint compatibility (collection routes, raw-array `replace`, non-destructive `remove`), so regressions are caught automatically, and the script will start/stop the MySQL container for you.

## Legacy import paths

Earlier versions exposed re-export shims such as `examples/app.module.ts` and `examples/services/user.service.ts`. Those files have been removed. Update any downstream code to import from the canonical paths under `examples/apps/<scenario>/src` instead—e.g.:

```
import { AppModule } from 'examples/apps/basic-crud/src/app.module';
```

If you must keep compatibility for downstream consumers, consider publishing a small wrapper inside your own project rather than re-introducing the shared shims here.

## Naming conventions & hygiene

- Use kebab-case for scenario folders (e.g., `advanced-filters`, `issue-1234-bulk-delete`).
- Prepend reproduction folders with a sortable ISO date (`YYYY-MM-DD`) to make pruning and triaging simpler.
- Document the purpose, setup commands, and expected output in each example or reproduction `README`.
- Prefer promoting resolved reproductions into polished `apps/` examples so they remain covered by regression tests.
