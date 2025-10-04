# Shared Example Assets

Centralized utilities, entities, providers, and configuration snippets that can be reused across multiple example applications.

- Place reusable TypeORM entities or DTOs in `entities/`
- Share data factories and seeding helpers in `seeders/`
- Store dotenv templates, configuration files, and scripts in `config/`

Each example app can import from `@examples/shared/*` (see `examples/tsconfig.json` path aliases) to avoid copy-pasting boilerplate.
