import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerModule } from 'nestjs-blueprint-crud';
import { Organization } from '../entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    CrudControllerModule.forEntity({
      entity: Organization,
      prefix: 'organizations',
      tagName: 'Organizations',
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
export class OrganizationModule {}
