// Core entities
export * from './lib/entities/base.entity';

// Services
export * from './lib/services/waterline-query.service';
export * from './lib/services/base.service';
export * from './lib/services/base-association.service';

// Controllers
export * from './lib/controllers/base.controller';
export * from './lib/controllers/base-association.controller';

// Decorators
export * from './lib/decorators/create-update-property.decorator';
export * from './lib/decorators/query-property.decorator';
export * from './lib/decorators/serialize-property.decorator';
export * from './lib/decorators/crud-property.decorator';
export * from './lib/decorators/inject-crud-service.decorator';

// DTOs
export * from './lib/dtos/query.dto';

// Pipes
export * from './lib/pipes/validate-id.pipe';

// Interfaces (export specific interfaces to avoid conflicts)
export {
  Criteria,
  CountCriteria,
  EntityWhereCriteria,
  SortOption,
  IQueryCriteria,
  IListQueryDto,
  ICountQueryDto,
} from './lib/interfaces/crud.interfaces';

// Note: ICreateDto and IUpdateDto are exported from decorators to avoid conflicts

// Modules
export * from './lib/modules/waterline-query.module';
export * from './lib/modules/base-service.module';
export * from './lib/modules/base-controller.module';

// Utilities and types
