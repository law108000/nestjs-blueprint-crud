import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';

const dbType = process.env.DB_TYPE ?? 'mysql';

const getTypeOrmConfig = () => {
  const baseConfig = {
    type: dbType as any,
    entities: [User, Order],
    synchronize: true, // Only use in development environment
    logging: process.env.NODE_ENV !== 'test',
  };

  if (dbType === 'sqlite') {
    return {
      ...baseConfig,
      database: process.env.DB_NAME ?? 'nestjs_crud_example.db',
    };
  }

  return {
    ...baseConfig,
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME ?? 'nestjs_crud_example',
  };
};

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmConfig())],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: DataSource,
    },
  ],
  exports: ['DATABASE_CONNECTION', TypeOrmModule],
})
export class DatabaseModule {}
