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
  Inject
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BaseAssociationService } from '../services/base-association.service';
import type { BaseEntity } from '../entities/base.entity';
import { ValidateIdPipe } from '../pipes/validate-id.pipe';
import { 
  ListQueryParamsRequestDto, 
  CountRequestDto,
  ReplaceAssociationsDto
} from '../dtos/query.dto';

@Controller()
export class BaseAssociationController<Parent extends BaseEntity, Child extends BaseEntity> {
  protected readonly logger = new Logger(BaseAssociationController.name);

  constructor(
    private readonly baseAssociationService: BaseAssociationService<Parent, Child>,
    @Inject('ASSOCIATION_NAME') private readonly association: string
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id/:association')
  @ApiOperation({ summary: 'Find associated entities' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiResponse({ status: 200, description: 'Associated entities', isArray: true })
  async findAssociations(
    @Param('id', ValidateIdPipe) id: number,
    @Query() query: ListQueryParamsRequestDto
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

    return this.baseAssociationService.findAssociations(id, this.association, criteria);
  }

  @Get(':id/:association/count')
  @ApiOperation({ summary: 'Count associated entities' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiResponse({ status: 200, description: 'Count of associated entities', schema: { type: 'object', properties: { count: { type: 'number' } } } })
  async countAssociations(
    @Param('id', ValidateIdPipe) id: number,
    @Query() query: CountRequestDto
  ): Promise<{ count: number }> {
    const { where } = query;
    
    const criteria = {
      where: where ? JSON.parse(where) : undefined,
    };

    const count = await this.baseAssociationService.countAssociations(id, this.association, criteria);
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
    @Param('fk', ValidateIdPipe) fk: number
  ): Promise<Parent> {
    return this.baseAssociationService.addAssociation(id, this.association, fk);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id/:association')
  @ApiOperation({ summary: 'Replace associations' })
  @ApiParam({ name: 'id', type: 'number', description: 'Parent entity ID' })
  @ApiParam({ name: 'association', type: 'string', description: 'Association name' })
  @ApiBody({ type: ReplaceAssociationsDto })
  @ApiResponse({ status: 200, description: 'Associations replaced successfully' })
  async replaceAssociations(
    @Param('id', ValidateIdPipe) id: number, 
    @Body() body: ReplaceAssociationsDto
  ): Promise<Parent> {
    const { ids = [] } = body;
    return this.baseAssociationService.replaceAssociations(id, this.association, ids);
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
    @Param('fk', ValidateIdPipe) fk: number
  ): Promise<Parent> {
    return this.baseAssociationService.removeAssociation(id, this.association, fk);
  }
}