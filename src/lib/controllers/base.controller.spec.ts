import { CrudController } from './base.controller';
import type { CrudService } from '../services/base.service';

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

    const result = await controller.bulkUpdate('1, 2,3', dto as any);

    expect(service.bulkUpdate).toHaveBeenCalledWith([1, 2, 3], dto);
    expect(result).toEqual([{ id: 1, name: 'Updated' }]);
  });

  it('should bulk remove entities', async () => {
    const removed = [{ id: 1 }, { id: 2 }];
    service.bulkRemove.mockResolvedValue(removed);

    const result = await controller.bulkRemove('1,2');

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
});
