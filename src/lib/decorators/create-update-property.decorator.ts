import 'reflect-metadata';
import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional, ApiPropertyOptions, PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseEntity } from '../entities/base.entity';

const CREATE_PROPERTY_METADATA_KEY = 'CREATE_PROPERTY_METADATA_KEY';
const UPDATE_PROPERTY_METADATA_KEY = 'UPDATE_PROPERTY_METADATA_KEY';

export interface ICreateDto {
  [key: string]: number | string | boolean | Date;
}

export interface IUpdateDto {
  [key: string]: number | string | boolean | Date;
}

const listOfCreateUpdateDto: {
  [key: string]: {
    CreateDto: new () => ICreateDto;
    UpdateDto: new () => IUpdateDto;
  }
} = {};

export type CreateUpdatePropertyOptions = ApiPropertyOptions & {
  isISO8601?: boolean;
  isTimestamp?: boolean;
};

export function CreateProperty(options: CreateUpdatePropertyOptions = {}) {
  return function (target: BaseEntity, propertyKey: string) {
    const metadataKey = `${propertyKey}@${CREATE_PROPERTY_METADATA_KEY}`;
    Reflect.defineMetadata(metadataKey, options, target);
  };
}

export function UpdateProperty(options: CreateUpdatePropertyOptions = {}) {
  return function (target: BaseEntity, propertyKey: string) {
    const metadataKey = `${propertyKey}@${UPDATE_PROPERTY_METADATA_KEY}`;
    Reflect.defineMetadata(metadataKey, options, target);
  };
}

type ApiCreateUpdatePropertyOptions = ApiPropertyOptions & {
  isTenantBaseEntity?: boolean;
  isISO8601?: boolean;
  isTimestamp?: boolean;
};

export function ApiCreateUpdateOptional(
  options: ApiCreateUpdatePropertyOptions = {}
): PropertyDecorator {
  const { anyOf: originalAnyOf, type: originalType, enum: originalEnum, isTenantBaseEntity, ...rest } = options;
  if (typeof originalType === 'string') {
    options.type = originalType;
  }
  if (isTenantBaseEntity) {
    options.type = 'number';
  }
  if (!options.type) {
    options.type = 'string';
  }

  if (options.enum) {
    const enumObj = options.enum as Record<string, string | number>;
    const enumKeys = Object.keys(enumObj).filter((key) => isNaN(Number(key)));
    const enumKeyValuePairs = enumKeys.map((key) => `${key}: ${enumObj[key]}`);
    options.description = options.description
      ? `${options.description}\n${enumKeyValuePairs.map((v) => `- ${v}`).join('\n')}`
      : `${enumKeyValuePairs.map((v) => `- ${v}`).join('\n')}`;
  }

  delete options.isTenantBaseEntity;
  delete options.isISO8601;
  delete options.isTimestamp;

  return ApiPropertyOptional({
    ...options,
  });
}

export function getCreatePropertyMetadata(target: BaseEntity, propertyKey: string) {
  const metadataKey = `${propertyKey}@${CREATE_PROPERTY_METADATA_KEY}`;
  return Reflect.getMetadata(metadataKey, target);
}

export function getUpdatePropertyMetadata(target: BaseEntity, propertyKey: string) {
  const metadataKey = `${propertyKey}@${UPDATE_PROPERTY_METADATA_KEY}`;
  return Reflect.getMetadata(metadataKey, target);
}

function generateSwaggerDtoForEntity(
  target: new () => BaseEntity,
  metaKey: string,
  dtoSuffix: string,
  getMetadata?: (prototype: any, propertyKey: string) => any
): new () => ICreateDto | IUpdateDto {
  const metadataKeys = Reflect.getMetadataKeys(target.prototype)
    .filter((key) => key.toString().includes(`@${metaKey}`))
    .map((key) => key.split('@')[0]);

  class Dto extends PickType(target, metadataKeys) implements ICreateDto, IUpdateDto {}
  Object.defineProperty(Dto, 'name', { value: `${target.name}${dtoSuffix}Dto` });

  for (const propertyKey of metadataKeys) {
    const metadata =
      (getMetadata && getMetadata(target.prototype, propertyKey)) ||
      Reflect.getMetadata(`${propertyKey}@${metaKey}`, target.prototype) ||
      {};

    const { type, isISO8601, isTimestamp, isEntity, entityName } = metadata;
    const originalType = Reflect.getMetadata('design:type', target.prototype, propertyKey);
    const originalTypeName = originalType?.name?.toLowerCase();
    const isTenantBaseEntity = BaseEntity.prototype.isPrototypeOf(originalType?.prototype);
    const isEnum = !!metadata.enum;

    Expose()(Dto.prototype, propertyKey);
    IsOptional()(Dto.prototype, propertyKey);

    if (isISO8601) {
      Transform(({ value }) => {
        return value ? new Date(value).toISOString() : value;
      }, { toClassOnly: true })(Dto.prototype, propertyKey);
    } else if (isTimestamp) {
      Transform(({ value }) => {
        return value ? new Date(value).getTime() : value;
      }, { toClassOnly: true })(Dto.prototype, propertyKey);
    }

    if (isTenantBaseEntity || isEntity) {
      ApiCreateUpdateOptional({
        ...metadata,
        type: 'number',
        isTenantBaseEntity: true,
      })(Dto.prototype, propertyKey);
    } else if (isEnum) {
      ApiCreateUpdateOptional({
        ...metadata,
        enum: metadata.enum,
      })(Dto.prototype, propertyKey);
    } else {
      ApiCreateUpdateOptional({
        ...metadata,
        type: metadata.type || originalTypeName || 'string',
      })(Dto.prototype, propertyKey);
    }
  }

  return Dto;
}

export function generateSwaggerCreateDtoForEntity(target: new () => BaseEntity) {
  if (listOfCreateUpdateDto[target.name]) {
    return listOfCreateUpdateDto[target.name].CreateDto;
  }
  return generateSwaggerDtoForEntity(target, CREATE_PROPERTY_METADATA_KEY, 'Create', getCreatePropertyMetadata);
}

export function generateSwaggerUpdateDtoForEntity<T extends BaseEntity>(
  target: new () => T
) {
  if (listOfCreateUpdateDto[target.name]) {
    return listOfCreateUpdateDto[target.name].UpdateDto;
  }
  return generateSwaggerDtoForEntity(target, UPDATE_PROPERTY_METADATA_KEY, 'Update', getUpdatePropertyMetadata);
}

export function generateSwaggerCreateUpdateDtoForEntity(target: new () => BaseEntity) : {
  CreateDto: new () => ICreateDto;
  UpdateDto: new () => IUpdateDto;
} {
  if (listOfCreateUpdateDto[target.name]) {
    return listOfCreateUpdateDto[target.name];
  }

  listOfCreateUpdateDto[target.name] = {
    CreateDto: generateSwaggerCreateDtoForEntity(target),
    UpdateDto: generateSwaggerUpdateDtoForEntity(target),
  };

  return listOfCreateUpdateDto[target.name];
}