import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { CrudEntity } from '../entities/base.entity';
import { generateSwaggerCreateUpdateDtoForEntity } from './create-update-property.decorator';

/**
 * Decorator to add Swagger documentation for the request body of Create/Update operations.
 * It automatically generates the DTO based on the entity's @CreateProperty/@UpdateProperty decorators.
 *
 * @param entity The entity class
 * @param type 'create' or 'update'
 */
export function CrudApiBody(entity: new () => CrudEntity, type: 'create' | 'update') {
  const { CreateDto, UpdateDto } = generateSwaggerCreateUpdateDtoForEntity(entity);
  return ApiBody({ type: type === 'create' ? CreateDto : UpdateDto });
}

/**
 * Decorator to add Swagger documentation for the standard CRUD query parameters.
 * Useful when overriding the find() method but not using the standard ListQueryParamsRequestDto in the signature.
 *
 * @param type The type of operation: 'list' (find), 'get' (findOne), or 'count'
 */
export function CrudApiQuery(type: 'list' | 'get' | 'count' = 'list') {
  const decorators: (MethodDecorator | ClassDecorator | PropertyDecorator)[] = [];

  if (type === 'list' || type === 'count') {
    decorators.push(
      ApiQuery({
        name: 'where',
        required: false,
        description: 'Filter criteria as JSON string',
        type: 'string',
        example: '{"name":"John"}',
      }),
    );
  }

  if (type === 'list') {
    decorators.push(
      ApiQuery({
        name: 'limit',
        required: false,
        description: 'Maximum number of records to return',
        type: 'number',
        example: 10,
      }),
      ApiQuery({
        name: 'skip',
        required: false,
        description: 'Number of records to skip',
        type: 'number',
        example: 0,
      }),
      ApiQuery({
        name: 'sort',
        required: false,
        description: 'Sort criteria (field ASC|DESC)',
        type: 'string',
        example: 'name ASC',
      }),
    );
  }

  if (type === 'list' || type === 'get') {
    decorators.push(
      ApiQuery({
        name: 'select',
        required: false,
        description: 'Fields to select (comma-separated)',
        type: 'string',
        example: 'id,name',
      }),
      ApiQuery({
        name: 'omit',
        required: false,
        description: 'Fields to omit (comma-separated)',
        type: 'string',
        example: 'password',
      }),
      ApiQuery({
        name: 'populate',
        required: false,
        description: 'Relations to populate (comma-separated)',
        type: 'string',
        example: 'user',
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator to add standard Swagger responses for CRUD operations.
 *
 * @param config Configuration object
 * @param config.type The type of operation: 'list', 'get', 'create', 'update', 'delete', 'count'
 * @param config.entity The entity class (optional, used for response schema)
 */
export function CrudApiResponse(config: {
  type: 'list' | 'get' | 'create' | 'update' | 'delete' | 'count';
  entity?: new () => CrudEntity;
}) {
  const { type, entity } = config;
  const decorators: (MethodDecorator | ClassDecorator | PropertyDecorator)[] = [];

  switch (type) {
    case 'list':
      decorators.push(
        ApiResponse({
          status: 200,
          description: 'List of records',
          type: entity,
          isArray: true,
        }),
      );
      break;
    case 'get':
      decorators.push(
        ApiResponse({ status: 200, description: 'Record found', type: entity }),
        ApiResponse({ status: 404, description: 'Record not found' }),
      );
      break;
    case 'create':
      decorators.push(
        ApiResponse({ status: 201, description: 'Record created', type: entity }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
      );
      break;
    case 'update':
      decorators.push(
        ApiResponse({ status: 200, description: 'Record updated', type: entity }),
        ApiResponse({ status: 404, description: 'Record not found' }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
      );
      break;
    case 'delete':
      decorators.push(
        ApiResponse({ status: 200, description: 'Record deleted', type: entity }),
        ApiResponse({ status: 404, description: 'Record not found' }),
      );
      break;
    case 'count':
      decorators.push(
        ApiResponse({
          status: 200,
          description: 'Count of records',
          schema: { type: 'object', properties: { count: { type: 'number' } } },
        }),
      );
      break;
  }

  return applyDecorators(...decorators);
}
