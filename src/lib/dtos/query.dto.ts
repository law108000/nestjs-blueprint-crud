import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListQueryParamsRequestDto {
  @ApiPropertyOptional({
    description: 'Filter criteria as JSON string',
    type: 'string',
    example: '{"name":"John","age":{">=":18}}',
  })
  @IsOptional()
  @IsString()
  where?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of records to return',
    type: 'number',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    type: 'number',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Sort criteria (field ASC|DESC)',
    type: 'string',
    example: 'name ASC',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Fields to select (comma-separated)',
    type: 'string',
    example: 'id,name,email',
  })
  @IsOptional()
  @IsString()
  select?: string;

  @ApiPropertyOptional({
    description: 'Fields to omit (comma-separated)',
    type: 'string',
    example: 'password,createdAt',
  })
  @IsOptional()
  @IsString()
  omit?: string;

  @ApiPropertyOptional({
    description: 'Relations to populate (comma-separated)',
    type: 'string',
    example: 'user,category',
  })
  @IsOptional()
  @IsString()
  populate?: string;
}

export class GetQueryParamsRequestDto {
  @ApiPropertyOptional({
    description: 'Fields to select (comma-separated)',
    type: 'string',
    example: 'id,name,email',
  })
  @IsOptional()
  @IsString()
  select?: string;

  @ApiPropertyOptional({
    description: 'Fields to omit (comma-separated)',
    type: 'string',
    example: 'password,createdAt',
  })
  @IsOptional()
  @IsString()
  omit?: string;

  @ApiPropertyOptional({
    description: 'Relations to populate (comma-separated)',
    type: 'string',
    example: 'user,category',
  })
  @IsOptional()
  @IsString()
  populate?: string;
}

export class CountRequestDto {
  @ApiPropertyOptional({
    description: 'Filter criteria as JSON string',
    type: 'string',
    example: '{"name":"John","age":{">=":18}}',
  })
  @IsOptional()
  @IsString()
  where?: string;
}

export class ReplaceAssociationsDto {
  @ApiPropertyOptional({
    description: 'Array of IDs to associate',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  @Type(() => Number)
  ids?: (number | string)[];
}

export type CreateRequestDto = Record<string, unknown>;
export type UpdateRequestDto = Record<string, unknown>;
