import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Module, DynamicModule } from '@nestjs/common';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CrudEntity } from '../entities/base.entity';
import { CrudControllerModule } from './base-controller.module';
import { SerializeProperty } from '../decorators/serialize-property.decorator';
import { CrudProperty } from '../decorators/crud-property.decorator';
import * as fs from 'fs';

@Entity('organizations')
class Organization extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'Organization name' })
  name!: string;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  @SerializeProperty({
    isEntity: true,
    entityName: 'Organization',
    description: 'Parent organization',
  })
  parent?: Organization | null;

  @OneToMany(() => Organization, (org) => org.parent)
  @SerializeProperty({
    isEntity: true,
    entityName: 'Organization',
    description: 'Child organizations',
  })
  children!: Organization[];

  @OneToMany(() => User, (user) => user.organization)
  @SerializeProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Organization users',
  })
  users!: User[];

  @Column({ nullable: true })
  parentId?: number | null;
}

@Entity('users')
class User extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'User name' })
  name!: string;

  @ManyToOne(() => Organization, (org) => org.users, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  @SerializeProperty({
    isEntity: true,
    entityName: 'Organization',
    description: 'User organization',
  })
  organization?: Organization | null;

  @Column({ nullable: true })
  organizationId?: number | null;

  @OneToMany(() => Role, (role) => role.user)
  @SerializeProperty({
    isEntity: true,
    entityName: 'Role',
    description: 'User roles',
  })
  roles!: Role[];
}

@Entity('roles')
class Role extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'Role name' })
  name!: string;

  @ManyToOne(() => User, (user) => user.roles)
  @JoinColumn({ name: 'userId' })
  @SerializeProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Role user',
  })
  user!: User;

  @Column()
  userId!: number;

  @OneToMany(() => Permission, (permission) => permission.role)
  @SerializeProperty({
    isEntity: true,
    entityName: 'Permission',
    description: 'Role permissions',
  })
  permissions!: Permission[];
}

@Entity('permissions')
class Permission extends CrudEntity {
  @Column()
  @CrudProperty({ description: 'Permission name' })
  name!: string;

  @ManyToOne(() => Role, (role) => role.permissions)
  @JoinColumn({ name: 'roleId' })
  @SerializeProperty({
    isEntity: true,
    entityName: 'Role',
    description: 'Permission role',
  })
  role!: Role;

  @Column()
  roleId!: number;
}

@Module({})
class TestDatabaseModule {
  static forRoot(): DynamicModule {
    const mockRepository = {
      metadata: {
        name: 'TestEntity',
        relations: [],
        columns: [{ propertyPath: 'id' }, { propertyPath: 'name' }],
        findRelationWithPropertyPath: () => undefined,
        findColumnWithPropertyPath: () => ({}),
      },
      createQueryBuilder: () => ({
        andWhere() {
          return this;
        },
        orWhere() {
          return this;
        },
        leftJoinAndSelect() {
          return this;
        },
        take() {
          return this;
        },
        skip() {
          return this;
        },
        orderBy() {
          return this;
        },
        addOrderBy() {
          return this;
        },
        select() {
          return this;
        },
        getRawAndEntities: async () => ({ raw: [], entities: [] }),
        getCount: async () => 0,
      }),
      save: async () => ({}),
      update: async () => ({}),
      softDelete: async () => ({}),
      restore: async () => ({}),
      count: async () => 0,
    };

    return {
      module: TestDatabaseModule,
      global: true,
      providers: [
        {
          provide: 'DATABASE_CONNECTION',
          useValue: { getRepository: () => mockRepository },
        },
      ],
      exports: ['DATABASE_CONNECTION'],
    };
  }
}

describe('Swagger Schema References', () => {
  it('should not generate empty $ref values for entity relationships', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestDatabaseModule.forRoot(),
        CrudControllerModule.forEntity({
          entity: Organization,
          prefix: 'organizations',
          tagName: 'Organizations',
        }),
        CrudControllerModule.forEntity({
          entity: User,
          prefix: 'users',
          tagName: 'Users',
        }),
        CrudControllerModule.forEntity({
          entity: Role,
          prefix: 'roles',
          tagName: 'Roles',
        }),
        CrudControllerModule.forEntity({
          entity: Permission,
          prefix: 'permissions',
          tagName: 'Permissions',
        }),
      ],
    }).compile();

    const app = moduleRef.createNestApplication();

    const config = new DocumentBuilder().setTitle('Test API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);

    // Save the document to a file for inspection
    try {
      fs.writeFileSync('/tmp/swagger-test.json', JSON.stringify(document, null, 2));
    } catch {
      // Ignore file write errors
    }

    // Check for empty $ref values
    const documentStr = JSON.stringify(document);
    const emptyRefPattern = /"(\$ref|allOf|items|type)"[^}]*?"#\/components\/schemas\/"/;
    const hasEmptyRefs = emptyRefPattern.test(documentStr);

    expect(hasEmptyRefs).toBe(false);

    // Also verify that the schemas are properly defined
    expect(document.components?.schemas).toBeDefined();
    expect(document.components?.schemas?.['OrganizationRecordDto']).toBeDefined();
    expect(document.components?.schemas?.['UserRecordDto']).toBeDefined();
    expect(document.components?.schemas?.['RoleRecordDto']).toBeDefined();
    expect(document.components?.schemas?.['PermissionRecordDto']).toBeDefined();

    await app.close();
  });
});
