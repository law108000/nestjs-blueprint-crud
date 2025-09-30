import 'reflect-metadata';
import { applyDecorators } from '@nestjs/common';
import { ApiResponseProperty, PickType, type ApiResponseOptions } from '@nestjs/swagger';
import { Expose, Transform, Exclude } from 'class-transformer';
import type { BaseEntity } from '../entities/base.entity';

const SERIALIZE_PROPERTY_METADATA_KEY = 'SERIALIZE_PROPERTY_METADATA_KEY';

const listOfRecordsDto: { [entityName: string]: any } = {};
const pendingResolutions: { [entityName: string]: Array<() => void> } = {};

function registerDTO(entityName: string, model: any): void {
  listOfRecordsDto[entityName] = model;
  
  if (pendingResolutions[entityName]?.length) {
    delete pendingResolutions[entityName];
  }
}

function waitForDTO(entityName: string): Promise<any> {
  if (listOfRecordsDto[entityName]) {
    return Promise.resolve(listOfRecordsDto[entityName]);
  }
  
  return new Promise(resolve => {
    if (!pendingResolutions[entityName]) {
      pendingResolutions[entityName] = [];
    }
    
    pendingResolutions[entityName].push(() => {
      resolve(listOfRecordsDto[entityName]);
    });
  });
}

export type SerializePropertyOptions = ApiResponseOptions & {
  isEntity?: boolean;
  entityName?: string;
  isISO8601?: boolean;
  isTimestamp?: boolean;
} & (
  | { isEntity: true; entityName: string }
  | { isEntity?: false | undefined }
);

export function SerializeProperty(options: SerializePropertyOptions = {}) {
  return function (target: any, propertyKey: string) {
    const metadataKey = `${propertyKey}@${SERIALIZE_PROPERTY_METADATA_KEY}`;
    Reflect.defineMetadata(metadataKey, options, target);
  };
}

export function TransformToTimestamp() {
  return applyDecorators(
    ApiResponseProperty({ type: 'number', format: 'unix timestamp' }),
    Transform(({ value }) => {
      return value ? new Date(value).getTime() : value;
    }, { toPlainOnly: true })
  );
}

export function TransformToISO8601() {
  return applyDecorators(
    ApiResponseProperty({ type: 'string', format: 'yyyy-MM-ddTHH:mm:ssZ or yyyy-MM-ddTHH:mm:ss+HH:mm or yyyy-MM-ddTHH:mm:ss-HH:mm' }),
    Transform(({ value }) => {
      return value ? new Date(value).toISOString() : value;
    }, { toPlainOnly: true })
  );
}

export function TransformToEntity(entityName: string) {
  return applyDecorators(
    Exclude(),
    ApiResponseProperty({ type: () => waitForDTO(entityName) }),
    Transform(({ value }) => {
      return new (listOfRecordsDto[entityName])(value);
    }, { toPlainOnly: true })
  );
}

// function limitRecursionDepth(value: any, depth: number = 0, maxDepth: number = 1): any {
//   if (depth > maxDepth || value === null || value === undefined || typeof value !== 'object') {
//     return value?.id;
//   }

//   return value;
// }

export function getSerializePropertyMetadata(target: any, propertyKey: string) {
  const metadataKey = `${propertyKey}@${SERIALIZE_PROPERTY_METADATA_KEY}`;
  return Reflect.getMetadata(metadataKey, target);
}

export function generateSwaggerRecordDtoForEntity(target: new () => BaseEntity) {
  if (!target) {
    return null;
  }
  if (listOfRecordsDto[target?.name]) {
    return listOfRecordsDto[target.name];
  }

  const metadataKeys = Reflect.getMetadataKeys(target?.prototype).filter(key =>
    key.toString().includes(`@${SERIALIZE_PROPERTY_METADATA_KEY}`)
    || Reflect.getMetadata('design:expose', target.prototype, key.split('@')[0]) === true
  ).map(key => key.split('@')[0]);

  class RecordDto extends PickType(target, metadataKeys) {
    constructor(partial?: Partial<InstanceType<typeof target>>) {
      super();
      if (partial) {
        Object.assign(this, partial);
      }
    }
    
    toJSON() {
      return { ...this };
    }
  }
  Object.defineProperty(RecordDto, 'name', { value: `${target.name}RecordDto` });

  for (const propertyKey of metadataKeys) {
    const metadata = getSerializePropertyMetadata(target.prototype, propertyKey) as SerializePropertyOptions;
    const { isISO8601, isTimestamp, isEntity, entityName, ...rest } = metadata;
    const propertyType = Reflect.getMetadata('design:type', target.prototype, propertyKey);

    Expose()(RecordDto.prototype, propertyKey);
    if (isISO8601) {
      TransformToISO8601()(RecordDto.prototype, propertyKey);
    }
    else if (isTimestamp) {
      TransformToTimestamp()(RecordDto.prototype, propertyKey);
    }
    else if (isEntity) {
      TransformToEntity(entityName!)(RecordDto.prototype, propertyKey);
    }
    else {
      ApiResponseProperty({
        ...rest,
        type: propertyType
      })(RecordDto.prototype, propertyKey);
    }
  }

  registerDTO(target.name, RecordDto);

  return RecordDto;
}