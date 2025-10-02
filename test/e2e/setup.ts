process.env.DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT ?? '3307';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'password';
process.env.DB_NAME = process.env.DB_NAME ?? 'nestjs_crud_example';

jest.setTimeout(60000);
