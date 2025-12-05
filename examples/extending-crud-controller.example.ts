/**
 * Example: Extending CrudController with Custom Logic
 *
 * This example demonstrates how to extend CrudController and override default endpoints
 * while maintaining full type safety by using the exposed DTO types.
 */

import { Controller, Query, Body, Param, Get, Post, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Entity, Column } from 'typeorm';
import { CrudController, CrudEntity, InjectCrudService, CrudService } from 'nestjs-blueprint-crud';

// Define your entity
@Entity()
class Product extends CrudEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'discontinued';
}

/**
 * Example 1: Basic Controller Extension
 * Override endpoints with custom logic while maintaining type safety
 */
@Controller('products')
@ApiTags('Products')
export class ProductController extends CrudController<Product> {
  constructor(
    @InjectCrudService(Product)
    protected readonly crudService: CrudService<Product>,
  ) {
    super(crudService);
  }

  // Override find with custom logging
  // Use CrudController.ListQueryRequest for type safety
  @Get()
  @ApiOperation({ summary: 'Find all products with custom logging' })
  async find(@Query() query: CrudController.ListQueryRequest): Promise<Product[]> {
    console.log('[ProductController] Finding products with query:', query);
    const results = await super.find(query);
    console.log(`[ProductController] Found ${results.length} products`);
    return results;
  }

  // Override create with validation
  // Use CrudController.CreateRequest for type safety
  @Post()
  @ApiOperation({ summary: 'Create product with validation' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() entity: CrudController.CreateRequest): Promise<Product> {
    // Add custom validation
    if (!entity.name || entity.name.length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }

    if (typeof entity.price === 'number' && entity.price < 0) {
      throw new Error('Product price must be positive');
    }

    console.log('[ProductController] Creating product:', entity);
    return super.create(entity);
  }

  // Override update with business logic
  // Use CrudController.UpdateRequest for type safety
  @Patch(':id')
  @ApiOperation({ summary: 'Update product with business rules' })
  async update(
    @Param('id') id: number,
    @Body() entity: CrudController.UpdateRequest,
  ): Promise<Product> {
    // Check if trying to set negative price
    if (typeof entity.price === 'number' && entity.price < 0) {
      throw new Error('Cannot set negative price');
    }

    // Add audit log
    console.log('[ProductController] Updating product %s with:', id, entity);

    return super.update(id, entity);
  }

  // Add custom endpoint using the service
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  async findFeatured(@Query() query: CrudController.ListQueryRequest): Promise<Product[]> {
    // Combine query with featured filter
    const whereClause = query.where ? JSON.parse(query.where) : {};
    const _featuredQuery: CrudController.ListQueryRequest = {
      ...query,
      where: JSON.stringify({ ...whereClause, featured: true }),
    };

    return this.crudService.find({
      where: { ...whereClause, featured: true },
      limit: query.limit,
      skip: query.skip,
      sort: query.sort,
      select: query.select,
      omit: query.omit,
      populate: query.populate,
    });
  }

  // Add another custom endpoint
  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  async findLowStock(@Query() query: CrudController.ListQueryRequest): Promise<Product[]> {
    // Custom query with complex criteria
    return this.crudService.find({
      where: { status: 'active' },
      sort: 'price ASC',
      limit: query.limit || 10,
    });
  }
}

/**
 * Example 2: Using Static DTO Classes
 * Instantiate DTO classes for default values or testing
 */
@Controller('advanced-products')
@ApiTags('Advanced Products')
export class AdvancedProductController extends CrudController<Product> {
  constructor(
    @InjectCrudService(Product)
    protected readonly crudService: CrudService<Product>,
  ) {
    super(crudService);
  }

  // Use static class references to instantiate DTOs
  @Get()
  async find(@Query() query?: CrudController.ListQueryRequest): Promise<Product[]> {
    // Create default query if none provided
    const defaultQuery = new CrudController.ListQueryRequestDto();
    defaultQuery.limit = 50;
    defaultQuery.sort = 'createdAt DESC';

    const finalQuery = query ?? defaultQuery;
    return super.find(finalQuery);
  }

  // Override findOne with default query parameters
  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query() query?: CrudController.GetQueryRequest,
  ): Promise<Product> {
    // Create default query with populated relationships
    const defaultQuery = new CrudController.GetQueryRequestDto();
    defaultQuery.populate = 'category,supplier';

    const finalQuery = query ?? defaultQuery;
    return super.findOne(id, finalQuery);
  }
}

/**
 * Example 3: Type-Safe Method Overrides
 * Demonstrates full type safety across all CRUD operations
 */
@Controller('typed-products')
@ApiTags('Typed Products')
export class TypedProductController extends CrudController<Product> {
  constructor(
    @InjectCrudService(Product)
    protected readonly crudService: CrudService<Product>,
  ) {
    super(crudService);
  }

  // All methods use namespace types for consistency
  @Get()
  async find(@Query() query: CrudController.ListQueryRequest): Promise<Product[]> {
    return super.find(query);
  }

  @Get('count')
  async count(@Query() query: CrudController.CountRequest): Promise<{ count: number }> {
    return super.count(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query() query: CrudController.GetQueryRequest,
  ): Promise<Product> {
    return super.findOne(id, query);
  }

  @Post()
  async create(@Body() entity: CrudController.CreateRequest): Promise<Product> {
    return super.create(entity);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() entity: CrudController.UpdateRequest,
  ): Promise<Product> {
    return super.update(id, entity);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Product> {
    return super.remove(id);
  }
}

/**
 * Key Benefits of Using CrudController DTO Types:
 *
 * 1. Type Safety: Full TypeScript checking for all parameters
 * 2. Consistency: All DTOs accessible from one place
 * 3. Discoverability: IDE autocomplete shows available types
 * 4. Maintainability: Changes to DTOs automatically propagate
 * 5. Less Imports: No need to import each DTO separately
 *
 * Available Types:
 * - CrudController.ListQueryRequest (for find operations)
 * - CrudController.GetQueryRequest (for findOne operations)
 * - CrudController.CountRequest (for count operations)
 * - CrudController.CreateRequest (for create operations)
 * - CrudController.UpdateRequest (for update operations)
 *
 * Available Static Classes (for instantiation):
 * - CrudController.ListQueryRequestDto
 * - CrudController.GetQueryRequestDto
 * - CrudController.CountRequestDto
 */
