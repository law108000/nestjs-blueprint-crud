import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Logger,
  ClassSerializerInterceptor,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CrudAssociationService } from '../services/base-association.service';
import type { CrudEntity } from '../entities/base.entity';
import { ValidateIdPipe } from '../pipes/validate-id.pipe';
import {
  ListQueryParamsRequestDto,
  CountRequestDto,
  type ReplaceAssociationsDto,
} from '../dtos/query.dto';

@Controller()
export class CrudAssociationController<Parent extends CrudEntity, Child extends CrudEntity> {
  protected readonly logger = new Logger(CrudAssociationController.name);

  constructor(
    private readonly crudAssociationService: CrudAssociationService<Parent, Child>,
    @Inject('ASSOCIATION_NAME') private readonly association: string,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id/:association')
  @ApiOperation({ summary: 'Find associated entities' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiResponse({ status: 200, description: 'Associated entities', isArray: true })
  async findAssociations(
    @Param('id', ValidateIdPipe) id: number,
    @Query() query: ListQueryParamsRequestDto,
  ): Promise<Child[]> {
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

    return this.crudAssociationService.findAssociations(id, this.association, criteria);
  }

  @Get(':id/:association/count')
  @ApiOperation({ summary: 'Count associated entities' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiResponse({
    status: 200,
    description: 'Count of associated entities',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async countAssociations(
    @Param('id', ValidateIdPipe) id: number,
    @Query() query: CountRequestDto,
  ): Promise<{ count: number }> {
    const { where } = query;

    const criteria = {
      where: where ? JSON.parse(where) : undefined,
    };

    const count = await this.crudAssociationService.countAssociations(
      id,
      this.association,
      criteria,
    );
    return { count };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id/:association/:fk')
  @ApiOperation({ summary: 'Add association' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiParam({ name: 'fk', type: 'number', description: 'Child entity ID' })
  @ApiResponse({ status: 200, description: 'Association added successfully' })
  async addAssociation(
    @Param('id', ValidateIdPipe) id: number,
    @Param('fk', ValidateIdPipe) fk: number,
  ): Promise<Parent> {
    return this.crudAssociationService.addAssociation(id, this.association, fk);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id/:association')
  @ApiOperation({ summary: 'Replace associations' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'number' },
              example: [1, 2, 3],
            },
          },
        },
        {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
      ],
    },
  })
  @ApiResponse({ status: 200, description: 'Associations replaced successfully' })
  async replaceAssociations(
    @Param('id', ValidateIdPipe) id: number,
    @Body() body: ReplaceAssociationsDto | number[],
  ): Promise<Parent> {
    const idsPayload = Array.isArray(body) ? body : (body?.ids ?? []);
    const ids = idsPayload.map(value => Number(value)).filter(value => !Number.isNaN(value));
    return this.crudAssociationService.replaceAssociations(id, this.association, ids);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id/:association/:fk')
  @ApiOperation({ summary: 'Remove association' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiParam({ name: 'fk', type: 'number', description: 'Child entity ID' })
  @ApiResponse({ status: 200, description: 'Association removed successfully' })
  async removeAssociation(
    @Param('id', ValidateIdPipe) id: number,
    @Param('fk', ValidateIdPipe) fk: number,
  ): Promise<Parent> {
    return this.crudAssociationService.removeAssociation(id, this.association, fk);
  }
}
