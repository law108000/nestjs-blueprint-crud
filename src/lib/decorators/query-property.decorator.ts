import 'reflect-metadata';
import { ApiPropertyOptional, PickType, type ApiPropertyOptions } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { CrudEntity } from '../entities/base.entity';
import {
  IQueryCriteria,
  type IListQueryDto,
  type ICountQueryDto,
} from '../interfaces/crud.interfaces';

const QUERY_PROPERTY_METADATA_KEY = 'QUERY_PROPERTY_METADATA_KEY';

const listOfRecordsDto: {
  [key: string]: {
    QueryCriteria: new () => IQueryCriteria;
    CountQueryDto: new () => ICountQueryDto;
    ListQueryDto: new () => IListQueryDto;
  };
} = {};

export type QueryPropertyOptions = ApiPropertyOptions & {
  isISO8601?: boolean;
  isTimestamp?: boolean;
  isEntity?: boolean;
  entityName?: string;
} & ({ isEntity: true; entityName: string } | { isEntity?: false | undefined });

export function QueryProperty(options: QueryPropertyOptions) {
  return function (target: CrudEntity, propertyKey: string) {
    const metadataKey = `${propertyKey}@${QUERY_PROPERTY_METADATA_KEY}`;
    Reflect.defineMetadata(metadataKey, options, target);
  };
}

export function getQueryPropertyMetadata(target: CrudEntity, propertyKey: string) {
  const metadataKey = `${propertyKey}@${QUERY_PROPERTY_METADATA_KEY}`;
  return Reflect.getMetadata(metadataKey, target);
}

export type ApiWhereCriteriaPropertyOptions = ApiPropertyOptions & {
  isEntity?: boolean;
};

export function ApiWhereCriteriaOptional(
  options: ApiWhereCriteriaPropertyOptions = {},
): PropertyDecorator {
  const { anyOf: originalAnyOf, type: originalType, isEntity } = options;

  const type: string = isEntity ? 'number' : (originalType as string);

  if (options.enum) {
    const enumObj = options.enum as Record<string, string | number>;
    const enumKeys = Object.keys(enumObj).filter(key => isNaN(Number(key)));
    const enumKeyValuePairs = enumKeys.map(key => `${key}: ${enumObj[key]}`);
    options.description += `\n${enumKeyValuePairs.map((value: string) => `- ${value}`).join('\n')}`;
  }

  if (type === 'boolean') {
    return ApiPropertyOptional({
      ...options,
      anyOf: [
        ...(originalAnyOf || []),
        { type },
        {
          type: 'object',
          description: `Filter records using operator-based criteria for boolean:
- "=": ${type}
- "!=": ${type}`,
        },
      ],
    });
  }
  return ApiPropertyOptional({
    ...options,
    anyOf: [
      ...(originalAnyOf || []),
      { type },
      {
        type: 'object',
        description: `Filter records using operator-based criteria:
- '<': ${type}
- '<=': ${type}
- '>': ${type}
- '>=': ${type}
- '!=': ${type}
- in: ${type}[]
- nin: ${type}[]
- contains: ${type}
- startsWith: ${type}
- endsWith: ${type}`,
      },
    ],
  });
}

export type KeyOfType<Type, ValueType> = keyof {
  [Key in keyof Type as Type[Key] extends ValueType ? Key : never]: any;
};

export function generateSwaggerQueryDtoForEntity<T extends CrudEntity>(
  target: new () => T,
): {
  QueryCriteria: new () => IQueryCriteria;
  CountQueryDto: new () => ICountQueryDto;
  ListQueryDto: new () => IListQueryDto;
} {
  if (listOfRecordsDto[target.name]) {
    return listOfRecordsDto[target.name];
  }

  const metadataKeys = Reflect.getMetadataKeys(target.prototype)
    .filter(key => key.toString().includes(`@${QUERY_PROPERTY_METADATA_KEY}`))
    .map(key => key.split('@')[0]);

  class QueryCriteria extends PickType(target, metadataKeys) implements IQueryCriteria {
    @ApiPropertyOptional({
      type: () => [QueryCriteria],
      description: 'AND conditions',
    })
    @IsOptional()
    and?: IQueryCriteria[];

    @ApiPropertyOptional({
      type: () => [QueryCriteria],
      description: 'OR conditions',
    })
    @IsOptional()
    or?: IQueryCriteria[];
  }
  Object.defineProperty(QueryCriteria, 'name', { value: `${target.name}QueryCriteria` });

  for (const propertyKey of metadataKeys) {
    const metadata = getQueryPropertyMetadata(target.prototype, propertyKey) || {};
    const { isEntity } = metadata;
    const originalType = Reflect.getMetadata('design:type', target.prototype, propertyKey);
    const originalTypeName = originalType?.name?.toLowerCase();
    const isCrudEntity = originalType?.prototype instanceof CrudEntity;
    const isEnum = !!metadata.enum;

    Expose()(QueryCriteria.prototype, propertyKey);
    IsOptional()(QueryCriteria.prototype, propertyKey);

    if (isCrudEntity || isEntity) {
      ApiWhereCriteriaOptional({
        ...metadata,
        type: 'number',
        isEntity: true,
      })(QueryCriteria.prototype, propertyKey);
    } else if (isEnum) {
      ApiWhereCriteriaOptional({
        ...metadata,
        enum: metadata.enum,
      })(QueryCriteria.prototype, propertyKey);
    } else {
      ApiWhereCriteriaOptional({
        ...metadata,
        type: metadata.type || originalTypeName || 'string',
      })(QueryCriteria.prototype, propertyKey);
    }
  }

  @Expose()
  class CountQueryDto implements ICountQueryDto {
    @ApiPropertyOptional({
      type: () => QueryCriteria,
      description: 'Filter criteria',
    })
    @IsOptional()
    where?: IQueryCriteria;
  }
  Object.defineProperty(CountQueryDto, 'name', { value: `${target.name}CountDto` });

  @Expose()
  class ListQueryDto implements IListQueryDto {
    @ApiPropertyOptional({
      type: () => QueryCriteria,
      description: 'Filter criteria',
    })
    @IsOptional()
    where?: IQueryCriteria;

    @ApiPropertyOptional({
      type: 'number',
      description: 'Maximum number of records to return',
    })
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({
      type: 'number',
      description: 'Number of records to skip',
    })
    @IsOptional()
    skip?: number;

    @ApiPropertyOptional({
      type: 'string',
      description: 'Sort criteria',
    })
    @IsOptional()
    sort?: string;

    @ApiPropertyOptional({
      type: 'string',
      description: 'Fields to select',
    })
    @IsOptional()
    select?: string;

    @ApiPropertyOptional({
      type: 'string',
      description: 'Fields to omit',
    })
    @IsOptional()
    omit?: string;

    @ApiPropertyOptional({
      type: 'string',
      description: 'Relations to populate',
    })
    @IsOptional()
    populate?: string;
  }
  Object.defineProperty(ListQueryDto, 'name', { value: `${target.name}ListDto` });

  listOfRecordsDto[target.name] = {
    QueryCriteria,
    CountQueryDto,
    ListQueryDto,
  };

  return {
    QueryCriteria,
    CountQueryDto,
    ListQueryDto,
  };
}
