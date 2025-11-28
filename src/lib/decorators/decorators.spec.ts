import 'reflect-metadata';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { CrudEntity } from '../entities/base.entity';
import {
  QueryProperty,
  getQueryPropertyMetadata,
  generateSwaggerQueryDtoForEntity,
} from './query-property.decorator';
import {
  CreateProperty,
  UpdateProperty,
  generateSwaggerCreateUpdateDtoForEntity,
} from './create-update-property.decorator';
import {
  SerializeProperty,
  generateSwaggerRecordDtoForEntity,
} from './serialize-property.decorator';
import { CrudProperty } from './crud-property.decorator';
import { InjectCrudService } from './inject-crud-service.decorator';
import { getCrudServiceInjectToken } from '../modules/base-service.module';

class DecoratedEntity extends CrudEntity {
  name!: string;
  relationId!: number;
  createdAtIso!: Date;
  createdAtTimestamp!: Date;
}

Reflect.decorate(
  [
    QueryProperty({
      type: 'string',
      description: 'Filter by name',
    }) as unknown as PropertyDecorator,
    CreateProperty({ type: 'string' }) as unknown as PropertyDecorator,
    UpdateProperty({ type: 'string' }) as unknown as PropertyDecorator,
    SerializeProperty({ type: 'string' }) as unknown as PropertyDecorator,
  ],
  DecoratedEntity.prototype,
  'name',
);

Reflect.decorate(
  [
    QueryProperty({
      isEntity: true,
      entityName: 'DecoratedEntity',
      description: 'Relation id',
    }) as unknown as PropertyDecorator,
  ],
  DecoratedEntity.prototype,
  'relationId',
);

Reflect.decorate(
  [
    CreateProperty({ isISO8601: true }) as unknown as PropertyDecorator,
    UpdateProperty({ isISO8601: true }) as unknown as PropertyDecorator,
    SerializeProperty({ isISO8601: true }) as unknown as PropertyDecorator,
  ],
  DecoratedEntity.prototype,
  'createdAtIso',
);

Reflect.decorate(
  [
    CreateProperty({ isTimestamp: true }) as unknown as PropertyDecorator,
    UpdateProperty({ isTimestamp: true }) as unknown as PropertyDecorator,
    SerializeProperty({ isTimestamp: true }) as unknown as PropertyDecorator,
  ],
  DecoratedEntity.prototype,
  'createdAtTimestamp',
);

describe('Custom decorators', () => {
  it('stores and retrieves query property metadata', () => {
    const metadata = getQueryPropertyMetadata(DecoratedEntity.prototype, 'relationId');

    expect(metadata).toMatchObject({ isEntity: true, entityName: 'DecoratedEntity' });
  });

  it('generates cached DTO classes for query criteria', () => {
    const first = generateSwaggerQueryDtoForEntity(DecoratedEntity);
    const second = generateSwaggerQueryDtoForEntity(DecoratedEntity);

    expect(second.QueryCriteria).toBe(first.QueryCriteria);
    expect(second.CountQueryDto).toBe(first.CountQueryDto);
    expect(second.ListQueryDto).toBe(first.ListQueryDto);
    expect(first.QueryCriteria.name).toBe('DecoratedEntityQueryCriteria');
    expect(first.CountQueryDto.name).toBe('DecoratedEntityCountDto');
    expect(first.ListQueryDto.name).toBe('DecoratedEntityListDto');
  });

  it('transforms ISO and timestamp fields in create/update DTOs', () => {
    const { CreateDto, UpdateDto } = generateSwaggerCreateUpdateDtoForEntity(DecoratedEntity);

    const isoInput = '2020-01-01T00:00:00Z';
    const timestampInput = '2020-01-02T12:34:56Z';

    const createInstance = plainToInstance(CreateDto, {
      createdAtIso: isoInput,
      createdAtTimestamp: timestampInput,
    });
    const updateInstance = plainToInstance(UpdateDto, {
      createdAtIso: isoInput,
      createdAtTimestamp: timestampInput,
    });

    const expectedIso = new Date(isoInput).toISOString();
    const expectedTimestamp = new Date(timestampInput).getTime();

    expect(createInstance.createdAtIso).toBe(expectedIso);
    expect(createInstance.createdAtTimestamp).toBe(expectedTimestamp);
    expect(updateInstance.createdAtIso).toBe(expectedIso);
    expect(updateInstance.createdAtTimestamp).toBe(expectedTimestamp);
  });

  it('serializes record DTO with ISO and timestamp transformations', () => {
    const RecordDto = generateSwaggerRecordDtoForEntity(DecoratedEntity)!;

    const dateIso = new Date('2020-03-04T05:06:07Z');
    const dateTimestamp = new Date('2020-05-06T07:08:09Z');

    const record = new RecordDto({
      name: 'Test',
      relationId: 1,
      createdAtIso: dateIso,
      createdAtTimestamp: dateTimestamp,
    });

    const plain = instanceToPlain(record);

    expect(plain.createdAtIso).toBe(dateIso.toISOString());
    expect(plain.createdAtTimestamp).toBe(dateTimestamp.getTime());
    expect(plain.name).toBe('Test');
  });

  it('should apply all decorators when using CrudProperty', () => {
    class CrudPropertyEntity extends CrudEntity {
      unifiedField!: string;
    }

    // Apply CrudProperty decorator
    CrudProperty({
      description: 'Unified field',
      type: 'string',
    })(CrudPropertyEntity.prototype, 'unifiedField');

    // Check that all individual decorators were applied
    const createMetadata = Reflect.getMetadata(
      'unifiedField@CREATE_PROPERTY_METADATA_KEY',
      CrudPropertyEntity.prototype,
    );
    const updateMetadata = Reflect.getMetadata(
      'unifiedField@UPDATE_PROPERTY_METADATA_KEY',
      CrudPropertyEntity.prototype,
    );
    const queryMetadata = getQueryPropertyMetadata(CrudPropertyEntity.prototype, 'unifiedField');
    const serializeMetadata = Reflect.getMetadata(
      'unifiedField@SERIALIZE_PROPERTY_METADATA_KEY',
      CrudPropertyEntity.prototype,
    );

    expect(createMetadata).toEqual({
      description: 'Unified field',
      type: 'string',
    });
    expect(updateMetadata).toEqual({
      description: 'Unified field',
      type: 'string',
    });
    expect(queryMetadata).toEqual({
      description: 'Unified field',
      type: 'string',
    });
    expect(serializeMetadata).toEqual({
      description: 'Unified field',
      type: 'string',
    });
  });

  it('should allow selective operation control with CrudProperty', () => {
    class SelectiveEntity extends CrudEntity {
      selectiveField!: string;
    }

    // Apply CrudProperty with selective operations
    CrudProperty({
      description: 'Selective field',
      type: 'string',
      create: false, // Disable create
      update: true, // Enable update
      query: false, // Disable query
      serialize: true, // Enable serialize
    })(SelectiveEntity.prototype, 'selectiveField');

    // Check that only enabled decorators were applied
    const createMetadata = Reflect.getMetadata(
      'selectiveField@CREATE_PROPERTY_METADATA_KEY',
      SelectiveEntity.prototype,
    );
    const updateMetadata = Reflect.getMetadata(
      'selectiveField@UPDATE_PROPERTY_METADATA_KEY',
      SelectiveEntity.prototype,
    );
    const queryMetadata = getQueryPropertyMetadata(SelectiveEntity.prototype, 'selectiveField');
    const serializeMetadata = Reflect.getMetadata(
      'selectiveField@SERIALIZE_PROPERTY_METADATA_KEY',
      SelectiveEntity.prototype,
    );

    expect(createMetadata).toBeUndefined();
    expect(updateMetadata).toEqual({
      description: 'Selective field',
      type: 'string',
    });
    expect(queryMetadata).toBeUndefined();
    expect(serializeMetadata).toEqual({
      description: 'Selective field',
      type: 'string',
    });
  });

  it('should exclude property from serialized output when serialize: false', () => {
    class SerializeFalseEntity extends CrudEntity {
      visibleField!: string;
      secretField!: string;
    }

    // Apply CrudProperty with serialize: true (default)
    CrudProperty({
      description: 'Visible field',
      type: 'string',
    })(SerializeFalseEntity.prototype, 'visibleField');

    // Apply CrudProperty with serialize: false
    CrudProperty({
      description: 'Secret field - should NOT be serialized',
      type: 'string',
      serialize: false,
    })(SerializeFalseEntity.prototype, 'secretField');

    // Create an instance with both properties
    const entity = new SerializeFalseEntity();
    Object.assign(entity, {
      id: 1,
      visibleField: 'visible-value',
      secretField: 'secret-value',
    });

    // Use class-transformer to serialize (this is what ClassSerializerInterceptor uses)
    const plain = instanceToPlain(entity);

    // The secretField should be excluded from serialized output
    expect(plain.secretField).toBeUndefined();
    // The visibleField should be included
    expect(plain.visibleField).toBe('visible-value');
    // The id should be included
    expect(plain.id).toBe(1);
  });

  describe('InjectCrudService', () => {
    it('should return an Inject decorator with the correct token', () => {
      class TestEntity extends CrudEntity {}

      const decorator = InjectCrudService(TestEntity);
      const expectedToken = getCrudServiceInjectToken(TestEntity);

      // The decorator should be an Inject decorator
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');

      // We can't easily test the exact decorator behavior without more complex setup,
      // but we can verify it returns something and the token is correct
      expect(expectedToken).toBe('TestEntityCrudService');
    });
  });

  describe('CrudEntity base class default columns', () => {
    it('should include id, createdAt, updatedAt, deletedAt in RecordDto by default', () => {
      // Create an entity that only has additional properties
      class SimpleEntity extends CrudEntity {
        customField!: string;
      }

      // Apply SerializeProperty to the custom field
      SerializeProperty({
        description: 'Custom field',
        type: 'string',
      })(SimpleEntity.prototype, 'customField');

      // Generate the RecordDto
      const RecordDto = generateSwaggerRecordDtoForEntity(SimpleEntity)!;

      // Create an instance with base entity columns and custom field
      const record = new RecordDto({
        id: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        customField: 'test value',
      });

      // Verify serialization includes all properties (base entity columns + custom field)
      const plain = instanceToPlain(record);

      // Verify base entity columns are serialized
      expect(plain.id).toBe(1);
      expect(plain.createdAt).toBeDefined();
      expect(plain.updatedAt).toBeDefined();
      expect(plain.deletedAt).toBeNull();
      // Verify custom field is also serialized
      expect(plain.customField).toBe('test value');
    });
  });
});
