import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Module,
  Post,
  Patch,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  HttpCode,
  type DynamicModule,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { CrudEntity } from '../entities/base.entity';
import { CrudController } from '../controllers/base.controller';
import { CrudServiceModule, getCrudServiceInjectToken } from './base-service.module';
import { CrudService } from '../services/base.service';
import { generateSwaggerRecordDtoForEntity } from '../decorators/serialize-property.decorator';
import { generateSwaggerCreateUpdateDtoForEntity } from '../decorators/create-update-property.decorator';
import {
  ListQueryParamsRequestDto,
  GetQueryParamsRequestDto,
  CountRequestDto,
  CreateRequestDto,
  UpdateRequestDto,
} from '../dtos/query.dto';
import { ValidateIdPipe } from '../pipes/validate-id.pipe';

// These metadata keys are duplicated from their respective decorator files.
// They are not exported to maintain encapsulation, but we need them here to
// read the metadata for generating dynamic Swagger examples.
const SERIALIZE_PROPERTY_METADATA_KEY = 'SERIALIZE_PROPERTY_METADATA_KEY';
const QUERY_PROPERTY_METADATA_KEY = 'QUERY_PROPERTY_METADATA_KEY';

interface EntityFieldInfo {
  name: string;
  type: string;
  example?: unknown;
  isRelation: boolean;
}

/**
 * Extracts field information from entity metadata for generating Swagger examples
 */
function getEntityFieldsInfo<T extends CrudEntity>(entity: new () => T): EntityFieldInfo[] {
  const fields: EntityFieldInfo[] = [];

  // Get metadata keys from entity prototype
  const metadataKeys = Reflect.getMetadataKeys(entity.prototype);

  // Extract fields from SerializeProperty metadata
  const serializeKeys = metadataKeys
    .filter(key => key.toString().includes(`@${SERIALIZE_PROPERTY_METADATA_KEY}`))
    .map(key => key.split('@')[0]);

  // Extract fields from QueryProperty metadata
  const queryKeys = metadataKeys
    .filter(key => key.toString().includes(`@${QUERY_PROPERTY_METADATA_KEY}`))
    .map(key => key.split('@')[0]);

  // Combine unique field names (prioritize query fields as they're more relevant for filtering)
  const fieldNames = [...new Set([...queryKeys, ...serializeKeys])];

  for (const fieldName of fieldNames) {
    // Get query property metadata if available
    const queryMetadataKey = `${fieldName}@${QUERY_PROPERTY_METADATA_KEY}`;
    const queryMetadata = Reflect.getMetadata(queryMetadataKey, entity.prototype) || {};

    // Get serialize property metadata if available
    const serializeMetadataKey = `${fieldName}@${SERIALIZE_PROPERTY_METADATA_KEY}`;
    const serializeMetadata = Reflect.getMetadata(serializeMetadataKey, entity.prototype) || {};

    // Get the design type
    const designType = Reflect.getMetadata('design:type', entity.prototype, fieldName);
    const typeName = designType?.name?.toLowerCase() || 'string';

    const isRelation = queryMetadata.isEntity || serializeMetadata.isEntity || false;

    fields.push({
      name: fieldName,
      type: typeName,
      example: queryMetadata.example || serializeMetadata.example,
      isRelation,
    });
  }

  return fields;
}

/**
 * Generates entity-specific Swagger examples for query parameters
 */
function generateEntityExamples<T extends CrudEntity>(entity: new () => T): {
  whereExample: string;
  sortExample: string;
  selectExample: string;
  omitExample: string;
  populateExample: string;
} {
  const fields = getEntityFieldsInfo(entity);

  // Filter out relations for most examples
  const regularFields = fields.filter(f => !f.isRelation);
  const relationFields = fields.filter(f => f.isRelation);

  // Generate where example using the first couple of regular fields
  let whereExample = '{}';
  if (regularFields.length > 0) {
    const whereObj: Record<string, unknown> = {};
    const firstField = regularFields[0];
    if (firstField.example !== undefined) {
      whereObj[firstField.name] = firstField.example;
    } else if (firstField.type === 'number') {
      whereObj[firstField.name] = { '>=': 1 };
    } else {
      whereObj[firstField.name] = 'value';
    }
    whereExample = JSON.stringify(whereObj);
  }

  // Generate sort example - prefer 'id' as it's always present in CrudEntity,
  // fallback to first field if available, otherwise use 'id DESC' as default
  const sortField = regularFields.find(f => f.name === 'id') || regularFields[0];
  const sortExample = sortField ? `${sortField.name} DESC` : 'id DESC';

  // Generate select example using first few regular field names
  const selectFields = regularFields.slice(0, Math.min(3, regularFields.length));
  const selectExample =
    selectFields.length > 0 ? selectFields.map(f => f.name).join(',') : 'id,name';

  // Generate omit example - typically timestamp fields or sensitive fields
  const omitFields = regularFields
    .filter(f => f.name.includes('At') || f.name.includes('password') || f.name.includes('secret'))
    .slice(0, 2);
  const omitExample =
    omitFields.length > 0 ? omitFields.map(f => f.name).join(',') : 'createdAt,updatedAt';

  // Generate populate example using relation field names
  const populateExample =
    relationFields.length > 0 ? relationFields.map(f => f.name).join(',') : '';

  return {
    whereExample,
    sortExample,
    selectExample,
    omitExample,
    populateExample,
  };
}

export interface CrudControllerConfig<T extends CrudEntity> {
  entity: new () => T;
  prefix: string;
  tagName: string;
  permissions?: {
    list?: boolean;
    count?: boolean;
    get?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  dtos?: {
    get?: new () => GetQueryParamsRequestDto;
    record?: new () => Record<string, unknown>;
  };
}

@Module({})
export class CrudControllerModule {
  static forEntity<T extends CrudEntity>(config: CrudControllerConfig<T>): DynamicModule {
    const { entity, prefix, tagName, permissions = {}, dtos } = config;
    const {
      list = true,
      count = true,
      get = true,
      create = true,
      update = true,
      delete: del = true,
    } = permissions;
    const GetDto = (dtos?.get ?? GetQueryParamsRequestDto) as new () => GetQueryParamsRequestDto;

    const { CreateDto, UpdateDto } = generateSwaggerCreateUpdateDtoForEntity(config.entity);
    const RecordDto = generateSwaggerRecordDtoForEntity(config.entity);
    const crudServiceModule = CrudServiceModule.forEntity(entity);
    const toArray = <V>(value?: V | V[]): V[] => {
      if (!value) {
        return [];
      }
      return Array.isArray(value) ? value : [value];
    };
    const crudServiceImports = toArray(crudServiceModule.imports);
    const crudServiceProviders = toArray(crudServiceModule.providers);
    const crudServiceExports = toArray(crudServiceModule.exports);

    // Generate entity-specific examples for query parameters
    const { whereExample, sortExample, selectExample, omitExample, populateExample } =
      generateEntityExamples(entity);

    @Controller({ path: prefix })
    @ApiTags(tagName)
    class DynamicCrudController extends CrudController<T> {
      constructor(
        @Inject(getCrudServiceInjectToken(entity))
        service: CrudService<T>,
      ) {
        super(service);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Get()
      @ApiQuery({
        name: 'where',
        required: false,
        type: 'string',
        description: 'Filter criteria as JSON string',
        example: whereExample,
      })
      @ApiQuery({
        name: 'limit',
        required: false,
        type: 'number',
        description: 'Maximum number of records to return',
        example: 10,
      })
      @ApiQuery({
        name: 'skip',
        required: false,
        type: 'number',
        description: 'Number of records to skip',
        example: 0,
      })
      @ApiQuery({
        name: 'sort',
        required: false,
        type: 'string',
        description: 'Sort criteria (field ASC|DESC)',
        example: sortExample,
      })
      @ApiQuery({
        name: 'select',
        required: false,
        type: 'string',
        description: 'Fields to select (comma-separated)',
        example: selectExample,
      })
      @ApiQuery({
        name: 'omit',
        required: false,
        type: 'string',
        description: 'Fields to omit (comma-separated)',
        example: omitExample,
      })
      @ApiQuery({
        name: 'populate',
        required: false,
        type: 'string',
        description: 'Relations to populate (comma-separated)',
        ...(populateExample ? { example: populateExample } : {}),
      })
      @ApiOkResponse({ type: RecordDto, isArray: true })
      async find(@Query() query?: ListQueryParamsRequestDto): Promise<T[]> {
        if (!list) throw new ForbiddenException();
        return await super.find((query ?? {}) as ListQueryParamsRequestDto);
      }

      @Get('count')
      @ApiQuery({
        name: 'where',
        required: false,
        type: 'string',
        description: 'Filter criteria as JSON string',
        example: whereExample,
      })
      async count(@Query() query: CountRequestDto = {}): Promise<{ count: number }> {
        if (!count) throw new ForbiddenException();
        return await super.count(query);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Get(':id')
      @UsePipes(
        new ValidationPipe({
          transform: true,
          expectedType: GetDto,
          exceptionFactory: errors => new BadRequestException(errors),
          transformOptions: { exposeUnsetFields: false, strategy: 'excludeAll' },
        }),
      )
      @ApiOkResponse({ type: RecordDto })
      async findOne(
        @Param('id', ValidateIdPipe) id: number,
        @Query() query: GetQueryParamsRequestDto = new GetDto(),
      ): Promise<T> {
        if (!get) throw new ForbiddenException();
        return await super.findOne(id, query);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Post()
      @HttpCode(201)
      @UsePipes(
        new ValidationPipe({
          transform: true,
          expectedType: CreateDto,
          exceptionFactory: errors => new BadRequestException(errors),
          transformOptions: { exposeUnsetFields: false, strategy: 'excludeAll' },
        }),
      )
      @ApiOkResponse({ type: RecordDto })
      async create(@Body() entity: CreateRequestDto = new CreateDto()): Promise<T> {
        if (!create) throw new ForbiddenException();
        return await super.create(entity);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Patch('bulk')
      @ApiOkResponse({ type: [RecordDto] })
      async bulkUpdate(
        @Query() query: Record<string, string>,
        @Body() entity: UpdateRequestDto,
      ): Promise<T[]> {
        const { ids } = query;
        const idArray = ids.split(',').map(id => parseInt(id.trim(), 10));
        return await this.crudService.bulkUpdate(idArray, entity as Partial<T>);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Patch(':id')
      @UsePipes(
        new ValidationPipe({
          transform: true,
          expectedType: UpdateDto,
          exceptionFactory: errors => new BadRequestException(errors),
          transformOptions: { exposeUnsetFields: false, strategy: 'excludeAll' },
        }),
      )
      @ApiOkResponse({ type: RecordDto })
      async update(
        @Param('id', ValidateIdPipe) id: number,
        @Body() entity: UpdateRequestDto = new UpdateDto(),
      ): Promise<T> {
        if (!update) throw new ForbiddenException();
        return await super.update(id, entity);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Delete('bulk')
      @ApiOkResponse({ type: [RecordDto] })
      async bulkRemove(@Query() query: Record<string, string>): Promise<T[]> {
        const { ids } = query;
        const idArray = ids.split(',').map(id => parseInt(id.trim(), 10));
        return await this.crudService.bulkRemove(idArray);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Delete(':id')
      @ApiOkResponse({ type: RecordDto })
      async remove(@Param('id', ValidateIdPipe) id: number): Promise<T> {
        if (!del) throw new ForbiddenException();
        return await super.remove(id);
      }
    }

    return {
      module: CrudControllerModule,
      imports: crudServiceImports,
      providers: [
        ...crudServiceProviders,
        {
          provide: `${entity.name}CrudController`,
          useFactory: service => new DynamicCrudController(service),
          inject: [getCrudServiceInjectToken(entity)],
        },
      ],
      exports: [...crudServiceExports, `${entity.name}CrudController`],
      controllers: [DynamicCrudController],
    };
  }
}
