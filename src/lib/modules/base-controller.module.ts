import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Module,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  type DynamicModule,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { BaseEntity } from '../entities/base.entity';
import { BaseController } from '../controllers/base.controller';
import { BaseServiceModule, getBaseServiceInjectToken } from './base-service.module';
import { BaseService } from '../services/base.service';
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

export interface BaseControllerConfig<T extends BaseEntity> {
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
    record?: new () => any;
  };
}

@Module({})
export class BaseControllerModule {
  static forEntity<T extends BaseEntity>(config: BaseControllerConfig<T>): DynamicModule {
    const { entity, prefix, tagName, permissions = {}, dtos = {} } = config;
    const {
      list = true,
      count = true,
      get = true,
      create = true,
      update = true,
      delete: del = true,
    } = permissions;
    const { get: GetDto = GetQueryParamsRequestDto } = dtos;

    const { CountQueryDto, ListQueryDto } = generateSwaggerQueryDtoForEntity(config.entity);
    const { CreateDto, UpdateDto } = generateSwaggerCreateUpdateDtoForEntity(config.entity);
    const RecordDto = generateSwaggerRecordDtoForEntity(config.entity);

    @Controller({ path: prefix })
    @ApiTags(tagName)
    class DynamicBaseController extends BaseController<T> {
      constructor(
        @Inject(getBaseServiceInjectToken(entity))
        service: BaseService<T>,
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
      async find(@Query() query: ListQueryParamsRequestDto = {}): Promise<T[]> {
        if (!list) throw new ForbiddenException();
        return await super.find(query as any);
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
        id: number,
        @Query() query: GetQueryParamsRequestDto = new GetDto(),
      ): Promise<T> {
        if (!get) throw new ForbiddenException();
        return await super.findOne(id, query);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Put()
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
      @Put(':id')
      @UsePipes(
        new ValidationPipe({
          transform: true,
          expectedType: UpdateDto,
          exceptionFactory: errors => new BadRequestException(errors),
          transformOptions: { exposeUnsetFields: false, strategy: 'excludeAll' },
        }),
      )
      @ApiOkResponse({ type: RecordDto })
      async update(id: number, @Body() entity: UpdateRequestDto = new UpdateDto()): Promise<T> {
        if (!update) throw new ForbiddenException();
        return await super.update(id, entity);
      }

      @UseInterceptors(ClassSerializerInterceptor)
      @Delete(':id')
      @ApiOkResponse({ type: RecordDto })
      async remove(id: number): Promise<T> {
        if (!del) throw new ForbiddenException();
        return await super.remove(id);
      }
    }

    return {
      module: BaseControllerModule,
      imports: [BaseServiceModule.forEntity(entity)],
      providers: [
        {
          provide: `${entity.name}BaseController`,
          useFactory: service => new DynamicBaseController(service),
          inject: [getBaseServiceInjectToken(entity)],
        },
      ],
      exports: [`${entity.name}BaseController`],
      controllers: [DynamicBaseController],
    };
  }
}
