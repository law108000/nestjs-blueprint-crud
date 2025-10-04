import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  Logger,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { BaseService } from '../services/base.service';
import type { BaseEntity } from '../entities/base.entity';
import { ValidateIdPipe } from '../pipes/validate-id.pipe';
import {
  ListQueryParamsRequestDto,
  GetQueryParamsRequestDto,
  CountRequestDto,
  CreateRequestDto,
  UpdateRequestDto,
} from '../dtos/query.dto';

@Controller()
export class BaseController<T extends BaseEntity> {
  protected readonly logger = new Logger(BaseController.name);

  constructor(protected readonly baseService: BaseService<T>) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  @ApiOperation({ summary: 'Find all entities' })
  @ApiResponse({ status: 200, description: 'List of entities', isArray: true })
  async find(@Query() query: ListQueryParamsRequestDto): Promise<T[]> {
    const { where, limit, skip, sort, select, omit, populate } = query;

    const criteria = {
      where: where ? JSON.parse(where) : undefined,
      limit,
      skip,
      sort,
      select,
      omit,
      populate,
    };

    return this.baseService.find(criteria);
  }

  @Get('count')
  @ApiOperation({ summary: 'Count entities' })
  @ApiResponse({
    status: 200,
    description: 'Count of entities',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async count(@Query() query: CountRequestDto): Promise<{ count: number }> {
    const { where } = query;

    const criteria = {
      where: where ? JSON.parse(where) : undefined,
    };

    const count = await this.baseService.count(criteria);
    return { count };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  @ApiOperation({ summary: 'Find entity by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity found' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findOne(
    @Param('id', ValidateIdPipe) id: number,
    @Query() query: GetQueryParamsRequestDto,
  ): Promise<T> {
    const { select, omit, populate } = query;
    return this.baseService.findOne(id, populate, select, omit);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 200, description: 'Entity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() entity: CreateRequestDto): Promise<T> {
    return this.baseService.create(entity as Partial<T>);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiParam({ name: 'id', type: 'number', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body() entity: UpdateRequestDto,
  ): Promise<T> {
    return this.baseService.update(id, entity as Partial<T>);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiParam({ name: 'id', type: 'number', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async remove(@Param('id', ValidateIdPipe) id: number): Promise<T> {
    return this.baseService.remove(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('bulk')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create multiple entities' })
  @ApiResponse({ status: 200, description: 'Entities created successfully', isArray: true })
  async bulkCreate(@Body() entities: CreateRequestDto[]): Promise<T[]> {
    return this.baseService.bulkCreate(entities as Partial<T>[]);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('bulk')
  @ApiOperation({ summary: 'Update multiple entities' })
  @ApiResponse({ status: 200, description: 'Entities updated successfully', isArray: true })
  async bulkUpdate(@Query('ids') ids: string, @Body() entity: UpdateRequestDto): Promise<T[]> {
    const idArray = ids.split(',').map(id => parseInt(id.trim(), 10));
    return this.baseService.bulkUpdate(idArray, entity as Partial<T>);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('bulk')
  @ApiOperation({ summary: 'Delete multiple entities' })
  @ApiResponse({ status: 200, description: 'Entities deleted successfully', isArray: true })
  async bulkRemove(@Query('ids') ids: string): Promise<T[]> {
    const idArray = ids.split(',').map(id => parseInt(id.trim(), 10));
    return this.baseService.bulkRemove(idArray);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post(':id/restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore soft-deleted entity' })
  @ApiParam({ name: 'id', type: 'number', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity restored successfully' })
  async restore(@Param('id', ValidateIdPipe) id: number): Promise<T> {
    return this.baseService.restore(id);
  }
}
