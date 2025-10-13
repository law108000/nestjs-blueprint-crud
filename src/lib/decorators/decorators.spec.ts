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
});
