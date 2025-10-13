import { Inject } from '@nestjs/common';
import type { CrudEntity } from '../entities/base.entity';
import { getCrudServiceInjectToken } from '../modules/base-service.module';

/**
 * Decorator that injects a CrudService for the specified entity.
 * This is a convenience decorator that wraps @Inject(getCrudServiceInjectToken(entity)).
 *
 * @param entity The entity class for which to inject the CrudService
 * @returns A property decorator that injects the CrudService
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectCrudService(User)
 *     private readonly crudService: CrudService<User>,
 *   ) {}
 * }
 * ```
 */
export function InjectCrudService<T extends CrudEntity>(entity: new () => T) {
  return Inject(getCrudServiceInjectToken(entity));
}
