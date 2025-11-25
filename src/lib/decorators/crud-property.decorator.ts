import 'reflect-metadata';
import { type ApiPropertyOptions, type ApiResponseOptions } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { type CrudEntity } from '../entities/base.entity';
import {
  CreateProperty,
  UpdateProperty,
  type CreateUpdatePropertyOptions,
} from './create-update-property.decorator';
import { QueryProperty, type QueryPropertyOptions } from './query-property.decorator';
import { SerializeProperty, type SerializePropertyOptions } from './serialize-property.decorator';

export type CrudPropertyOptions = ApiPropertyOptions &
  ApiResponseOptions & {
    // Common options
    description?: string;
    required?: boolean;
    // type?: any;
    // example?: any;
    // enum?: any;
    isISO8601?: boolean;
    isTimestamp?: boolean;

    // Entity relationship options
    isEntity?: boolean;
    entityName?: string;

    // Operation-specific control
    create?: boolean | CreateUpdatePropertyOptions;
    update?: boolean | CreateUpdatePropertyOptions;
    query?: boolean | QueryPropertyOptions;
    serialize?: boolean | SerializePropertyOptions;
  } & ({ isEntity: true; entityName: string } | { isEntity?: false | undefined });

/**
 * Unified decorator that applies CreateProperty, UpdateProperty, QueryProperty, and SerializeProperty
 * based on the provided options. By default, all operations are enabled.
 */
export function CrudProperty(options: CrudPropertyOptions = {}) {
  return function (target: CrudEntity, propertyKey: string) {
    const {
      create = true,
      update = true,
      query = true,
      serialize = true,
      ...commonOptions
    } = options;

    // Apply CreateProperty if enabled
    if (create) {
      const createOptions =
        typeof create === 'boolean' ? commonOptions : { ...commonOptions, ...create };
      CreateProperty(createOptions as CreateUpdatePropertyOptions)(target, propertyKey);
    }

    // Apply UpdateProperty if enabled
    if (update) {
      const updateOptions =
        typeof update === 'boolean' ? commonOptions : { ...commonOptions, ...update };
      UpdateProperty(updateOptions as CreateUpdatePropertyOptions)(target, propertyKey);
    }

    // Apply QueryProperty if enabled
    if (query) {
      const queryOptions =
        typeof query === 'boolean' ? commonOptions : { ...commonOptions, ...query };
      QueryProperty(queryOptions as QueryPropertyOptions)(target, propertyKey);
    }

    // Apply SerializeProperty if enabled
    if (serialize) {
      const serializeOptions =
        typeof serialize === 'boolean' ? commonOptions : { ...commonOptions, ...serialize };
      SerializeProperty(serializeOptions as SerializePropertyOptions)(target, propertyKey);
    } else {
      // When serialize is explicitly false, apply Exclude decorator to prevent
      // the property from being included in serialized responses
      Exclude()(target, propertyKey);
    }
  };
}
