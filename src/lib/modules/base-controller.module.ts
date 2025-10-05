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
import { generateSwaggerQueryDtoForEntity } from '../decorators/query-property.decorator';
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

    const { CountQueryDto, ListQueryDto } = generateSwaggerQueryDtoForEntity(config.entity);
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
        name: 'query',
        title: 'Where criteria',
        required: false,
        type: () => ListQueryDto,
      })
      @ApiOkResponse({ type: RecordDto, isArray: true })
      async find(@Query() query?: ListQueryParamsRequestDto): Promise<T[]> {
        if (!list) throw new ForbiddenException();
        return await super.find((query ?? {}) as ListQueryParamsRequestDto);
      }

      @Get('count')
      @ApiQuery({
        name: 'query',
        title: 'Where criteria',
        required: false,
        type: () => CountQueryDto,
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
