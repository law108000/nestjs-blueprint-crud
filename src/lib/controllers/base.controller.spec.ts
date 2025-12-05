import { CrudController } from './base.controller';
import type { CrudService } from '../services/base.service';
import {
  ListQueryParamsRequestDto,
  GetQueryParamsRequestDto,
  CountRequestDto,
} from '../dtos/query.dto';

describe('CrudController', () => {
  let controller: CrudController<any>;
  let service: jest.Mocked<CrudService<any>>;

  beforeEach(() => {
    service = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
      bulkRemove: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<CrudService<any>>;

    controller = new CrudController(service);
  });

  it('should delegate list queries to the service with parsed criteria', async () => {
    const query = {
      where: JSON.stringify({ status: 'active' }),
      limit: 5,
      skip: 2,
      sort: 'name DESC',
      select: 'id,name',
      omit: 'password',
      populate: 'role',
    } as any;

    await controller.find(query);

    expect(service.find).toHaveBeenCalledWith({
      where: { status: 'active' },
      limit: 5,
      skip: 2,
      sort: 'name DESC',
      select: 'id,name',
      omit: 'password',
      populate: 'role',
    });
  });

  it('should return count result from the service', async () => {
    service.count.mockResolvedValue(12);

    const result = await controller.count({ where: JSON.stringify({ status: 'active' }) } as any);

    expect(service.count).toHaveBeenCalledWith({ where: { status: 'active' } });
    expect(result).toEqual({ count: 12 });
  });

  it('should load one entity with modifiers', async () => {
    const entity = { id: 1 };
    service.findOne.mockResolvedValue(entity);

    const result = await controller.findOne(1, {
      select: 'name',
      omit: 'password',
      populate: 'role',
    } as any);

    expect(service.findOne).toHaveBeenCalledWith(1, 'role', 'name', 'password');
    expect(result).toBe(entity);
  });

  it('should create an entity', async () => {
    const dto = { name: 'New' };
    service.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should update an entity', async () => {
    const dto = { name: 'Updated' };
    service.update.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.update(1, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should remove an entity', async () => {
    const entity = { id: 1 };
    service.remove.mockResolvedValue(entity);

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toBe(entity);
  });

  it('should bulk create entities', async () => {
    const items = [{ name: 'A' }];
    service.bulkCreate.mockResolvedValue([{ id: 1, name: 'A' }]);

    const result = await controller.bulkCreate(items as any);

    expect(service.bulkCreate).toHaveBeenCalledWith(items);
    expect(result).toEqual([{ id: 1, name: 'A' }]);
  });

  it('should bulk update entities', async () => {
    const dto = { name: 'Updated' };
    service.bulkUpdate.mockResolvedValue([{ id: 1, name: 'Updated' }]);

    const result = await controller.bulkUpdate({ ids: '1, 2,3' }, dto as any);

    expect(service.bulkUpdate).toHaveBeenCalledWith([1, 2, 3], dto);
    expect(result).toEqual([{ id: 1, name: 'Updated' }]);
  });

  it('should bulk remove entities', async () => {
    const removed = [{ id: 1 }, { id: 2 }];
    service.bulkRemove.mockResolvedValue(removed);

    const result = await controller.bulkRemove({ ids: '1,2' });

    expect(service.bulkRemove).toHaveBeenCalledWith([1, 2]);
    expect(result).toEqual(removed);
  });

  it('should restore an entity', async () => {
    const entity = { id: 3 };
    service.restore.mockResolvedValue(entity);

    const result = await controller.restore(3);

    expect(service.restore).toHaveBeenCalledWith(3);
    expect(result).toBe(entity);
  });

  describe('query parameter edge cases', () => {
    it('should handle empty where parameter', async () => {
      const query = {
        where: '',
        limit: 5,
      } as any;

      await controller.find(query);

      expect(service.find).toHaveBeenCalledWith({
        where: undefined,
        limit: 5,
        skip: undefined,
        sort: undefined,
        select: undefined,
        omit: undefined,
        populate: undefined,
      });
    });

    it('should handle limit of 0', async () => {
      const query = {
        limit: 0,
      } as any;

      await controller.find(query);

      expect(service.find).toHaveBeenCalledWith({
        where: undefined,
        limit: 0,
        skip: undefined,
        sort: undefined,
        select: undefined,
        omit: undefined,
        populate: undefined,
      });
    });

    it('should handle negative limit gracefully', async () => {
      const query = {
        limit: -1,
      } as any;

      await controller.find(query);

      expect(service.find).toHaveBeenCalledWith({
        where: undefined,
        limit: -1,
        skip: undefined,
        sort: undefined,
        select: undefined,
        omit: undefined,
        populate: undefined,
      });
    });

    it('should handle complex sort syntax', async () => {
      const query = {
        sort: 'name ASC, age DESC',
      } as any;

      await controller.find(query);

      expect(service.find).toHaveBeenCalledWith({
        where: undefined,
        limit: undefined,
        skip: undefined,
        sort: 'name ASC, age DESC',
        select: undefined,
        omit: undefined,
        populate: undefined,
      });
    });

    it('should handle empty select and omit', async () => {
      const query = {
        select: '',
        omit: '',
      } as any;

      await controller.find(query);

      expect(service.find).toHaveBeenCalledWith({
        where: undefined,
        limit: undefined,
        skip: undefined,
        sort: undefined,
        select: '',
        omit: '',
        populate: undefined,
      });
    });
  });

  describe('Static DTO class references', () => {
    it('should expose ListQueryRequestDto as a static property', () => {
      expect(CrudController.ListQueryRequestDto).toBe(ListQueryParamsRequestDto);
    });

    it('should expose GetQueryRequestDto as a static property', () => {
      expect(CrudController.GetQueryRequestDto).toBe(GetQueryParamsRequestDto);
    });

    it('should expose CountRequestDto as a static property', () => {
      expect(CrudController.CountRequestDto).toBe(CountRequestDto);
    });

    it('should allow using static DTO classes to create instances', () => {
      const listQuery = new CrudController.ListQueryRequestDto();
      expect(listQuery).toBeInstanceOf(ListQueryParamsRequestDto);

      const getQuery = new CrudController.GetQueryRequestDto();
      expect(getQuery).toBeInstanceOf(GetQueryParamsRequestDto);

      const countQuery = new CrudController.CountRequestDto();
      expect(countQuery).toBeInstanceOf(CountRequestDto);
    });
  });

  describe('Type namespace exports', () => {
    it('should allow using namespace types in extended controllers', () => {
      interface TestEntity {
        id: number;
        name: string;
      }

      class ExtendedController extends CrudController<any> {
        // Test that we can use the namespace types in method signatures
        async find(query: CrudController.ListQueryRequest): Promise<TestEntity[]> {
          return super.find(query);
        }

        async findOne(id: number, query: CrudController.GetQueryRequest): Promise<TestEntity> {
          return super.findOne(id, query);
        }

        async count(query: CrudController.CountRequest): Promise<{ count: number }> {
          return super.count(query);
        }

        async create(entity: CrudController.CreateRequest): Promise<TestEntity> {
          return super.create(entity);
        }

        async update(id: number, entity: CrudController.UpdateRequest): Promise<TestEntity> {
          return super.update(id, entity);
        }
      }

      const extendedController = new ExtendedController(service);
      expect(extendedController).toBeInstanceOf(CrudController);
      expect(extendedController).toBeInstanceOf(ExtendedController);
    });

    it('should have correct type definitions in the namespace', () => {
      // This is a compile-time check that the types exist and are correct
      // These type assignments verify the namespace exports are correctly typed
      const checkTypes = (): void => {
        const _listQuery: CrudController.ListQueryRequest = {} as any;
        const _getQuery: CrudController.GetQueryRequest = {} as any;
        const _count: CrudController.CountRequest = {} as any;
        const _create: CrudController.CreateRequest = {} as any;
        const _update: CrudController.UpdateRequest = {} as any;
        // Suppress unused variable warning
        void _listQuery;
        void _getQuery;
        void _count;
        void _create;
        void _update;
      };

      // If this function compiles, the types are correctly defined
      expect(checkTypes).toBeDefined();
    });
  });
});
