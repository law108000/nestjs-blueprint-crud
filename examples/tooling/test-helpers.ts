import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

export type ExampleTestContext = {
  app: INestApplication;
  httpServer: ReturnType<INestApplication['getHttpServer']>;
  dataSource: DataSource;
};

export const DEFAULT_TABLE_RESET_ORDER = ['orders', 'users'] as const;

export async function bootstrapExampleApp<AppModuleType>(
  AppModule: Type<AppModuleType>,
): Promise<ExampleTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const dataSource = app.get(DataSource);

  return {
    app,
    httpServer: app.getHttpServer(),
    dataSource,
  };
}

export async function closeExampleApp(context: ExampleTestContext) {
  await context.app.close();
}

export async function truncateTables(dataSource: DataSource, tableNames: readonly string[]) {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tableNames) {
    await dataSource.query(`TRUNCATE TABLE ${table}`);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}
