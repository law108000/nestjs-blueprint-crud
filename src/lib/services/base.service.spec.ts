import { NotFoundException } from '@nestjs/common';
import { CrudService } from './base.service';

describe('CrudService', () => {
  let service: CrudService<any>;
  let mockRepository: any;
  let mockWaterlineQueryService: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      metadata: {
        relations: [{ propertyName: 'relation1' }, { propertyName: 'relation2' }],
      },
    };

    mockWaterlineQueryService = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      findWithModifiers: jest.fn().mockResolvedValue([]),
      countWithModifiers: jest.fn().mockResolvedValue(0),
    };

    service = new CrudService(mockWaterlineQueryService);
  });

  describe('find', () => {
    it('should call waterlineQueryService findWithModifiers with correct parameters', async () => {
      const options = { where: { name: 'test' } };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([]);

      await service.find(options);

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith(options);
    });

    it('should return the result from waterlineQueryService', async () => {
      const expected = [{ id: 1 }];
      const criteria = { where: { active: true } };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue(expected);

      const result = await service.find(criteria);

      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should find entity by id and return it', async () => {
      const id = 1;
      const entity = { id, name: 'test' };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const result = await service.findOne(id);

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id },
        populate: ['relation1', 'relation2'],
        select: undefined,
        omit: undefined,
        limit: 1,
      });
      expect(result).toEqual(entity);
    });

    it('should throw NotFoundException when id is null', async () => {
      await expect(service.findOne(null as unknown as number)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when entity is not found', async () => {
      const id = 99;
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([]);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`Entity with id ${id} not found`),
      );
    });

    it('should respect provided modifiers', async () => {
      const id = 5;
      const entity = { id, name: 'custom' };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const populate = 'relation3, relation4';
      const select = 'field1,field2';
      const omit = 'field3';

      const result = await service.findOne(id, populate, select, omit);

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id },
        populate: ['relation3', 'relation4'],
        select,
        omit,
        limit: 1,
      });
      expect(result).toEqual(entity);
    });
  });

  describe('create', () => {
    it('should create and save entity', async () => {
      const data = { name: 'test' };
      const entity = { id: 1, ...data };

      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);
      // Mock findOne to return the created entity when called after creation
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const result = await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('findOneBy', () => {
    it('should return null when entity not found', async () => {
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([]);

      const result = await service.findOneBy({ id: 1 });

      expect(result).toBeNull();
    });

    it('should use repository relations when populate not provided', async () => {
      const entity = { id: 2 };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const result = await service.findOneBy({ id: 2 });

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: 2 },
        populate: ['relation1', 'relation2'],
        limit: 1,
      });
      expect(result).toEqual(entity);
    });

    it('should split populate string into array', async () => {
      const entity = { id: 3 };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const result = await service.findOneBy({ id: 3 }, 'rel1, rel2');

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: 3 },
        populate: ['rel1', 'rel2'],
        limit: 1,
      });
      expect(result).toEqual(entity);
    });
  });

  describe('findByIds', () => {
    it('should return empty array when ids array is empty', async () => {
      const result = await service.findByIds([]);

      expect(result).toEqual([]);
      expect(mockWaterlineQueryService.findWithModifiers).not.toHaveBeenCalled();
    });

    it('should call findWithModifiers with parsed modifiers', async () => {
      const entities = [{ id: 1 }, { id: 2 }];
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue(entities);

      const result = await service.findByIds([1, 2], 'rel1, rel2', 'field', 'omitField');

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        populate: ['rel1', 'rel2'],
        select: 'field',
        omit: 'omitField',
      });
      expect(result).toEqual(entities);
    });
  });

  describe('update', () => {
    it('should update entity and return updated result', async () => {
      const id = 10;
      const entityData = { name: 'updated' };
      const existingEntity = { id, name: 'old' };
      const updatedEntity = { id, name: 'updated' };

      mockWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([existingEntity])
        .mockResolvedValueOnce([updatedEntity]);
      mockRepository.update.mockResolvedValue({});

      const result = await service.update(id, entityData);

      expect(mockRepository.update).toHaveBeenCalledWith(id, entityData);
      expect(result).toEqual(updatedEntity);
    });

    it('should handle updates with relation fields separately', async () => {
      const id = 10;
      const entityData = { name: 'updated', relation1: [1, 2] };
      const existingEntity = { id, name: 'old' };
      const updatedEntity = { id, name: 'updated', relation1: [1, 2] };

      mockWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([existingEntity])
        .mockResolvedValueOnce([updatedEntity]);
      mockRepository.update.mockResolvedValue({});
      mockRepository.save.mockResolvedValue(updatedEntity);

      const result = await service.update(id, entityData);

      // Should only update column fields with repository.update
      expect(mockRepository.update).toHaveBeenCalledWith(id, { name: 'updated' });
      // Should save relation fields separately using the existing entity
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEntity);
    });

    it('should only use save when updating relations without column changes', async () => {
      const id = 10;
      const entityData = { relation1: [1, 2] };
      const existingEntity = { id, name: 'old' };
      const updatedEntity = { id, name: 'old', relation1: [1, 2] };

      mockWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([existingEntity])
        .mockResolvedValueOnce([updatedEntity]);
      mockRepository.save.mockResolvedValue(updatedEntity);

      const result = await service.update(id, entityData);

      // Should not call repository.update when there are no column updates
      expect(mockRepository.update).not.toHaveBeenCalled();
      // Should save relation fields using the existing entity
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEntity);
    });
  });

  describe('remove', () => {
    it('should soft delete the entity and return it', async () => {
      const id = 11;
      const entity = { id };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);
      mockRepository.softDelete.mockResolvedValue({});

      const result = await service.remove(id);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(entity);
    });
  });

  describe('bulkCreate', () => {
    it('should create entities, save them, and return hydrated records', async () => {
      const data = [{ name: 'a' }, { name: 'b' }];
      const savedEntities = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const hydratedEntities = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];

      mockRepository.create.mockReturnValue(savedEntities);
      mockRepository.save.mockResolvedValue(savedEntities);
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue(hydratedEntities);

      const result = await service.bulkCreate(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(mockRepository.save).toHaveBeenCalledWith(savedEntities);
      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        populate: undefined,
        select: undefined,
        omit: undefined,
      });
      expect(result).toEqual(hydratedEntities);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple entities and return refreshed results', async () => {
      const ids = [4, 5];
      const data = { status: 'active' };
      const refreshed = [{ id: 4 }, { id: 5 }];

      mockRepository.update.mockResolvedValue({});
      const findByIdsSpy = jest.spyOn(service, 'findByIds').mockResolvedValue(refreshed as any);

      const result = await service.bulkUpdate(ids, data);

      expect(mockRepository.update).toHaveBeenCalled();
      const updateArgs = mockRepository.update.mock.calls[0][0];
      expect(updateArgs.id).toBeDefined();
      expect(updateArgs.id).toHaveProperty('_value', ids);
      expect(mockRepository.update).toHaveBeenCalledWith(updateArgs, data);
      expect(findByIdsSpy).toHaveBeenCalledWith(ids);
      expect(result).toEqual(refreshed);

      findByIdsSpy.mockRestore();
    });

    it('should handle bulk updates with relation fields separately', async () => {
      const ids = [4, 5];
      const data = { status: 'active', relation1: [1, 2] };
      const entities = [{ id: 4 }, { id: 5 }];
      const refreshed = [{ id: 4 }, { id: 5 }];

      mockRepository.update.mockResolvedValue({});
      mockRepository.find.mockResolvedValue(entities);
      mockRepository.save.mockResolvedValue(entities);
      const findByIdsSpy = jest.spyOn(service, 'findByIds').mockResolvedValue(refreshed as any);

      const result = await service.bulkUpdate(ids, data);

      // Should only update column fields with repository.update
      expect(mockRepository.update).toHaveBeenCalled();
      const updateArgs = mockRepository.update.mock.calls[0][0];
      expect(updateArgs.id).toBeDefined();
      expect(mockRepository.update.mock.calls[0][1]).toEqual({ status: 'active' });
      
      // Should save relation fields separately
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(entities);
      expect(findByIdsSpy).toHaveBeenCalledWith(ids);
      expect(result).toEqual(refreshed);

      findByIdsSpy.mockRestore();
    });

    it('should only use save when bulk updating relations without column changes', async () => {
      const ids = [4, 5];
      const data = { relation1: [1, 2] };
      const entities = [{ id: 4 }, { id: 5 }];
      const refreshed = [{ id: 4 }, { id: 5 }];

      mockRepository.find.mockResolvedValue(entities);
      mockRepository.save.mockResolvedValue(entities);
      const findByIdsSpy = jest.spyOn(service, 'findByIds').mockResolvedValue(refreshed as any);

      const result = await service.bulkUpdate(ids, data);

      // Should not call repository.update when there are no column updates
      expect(mockRepository.update).not.toHaveBeenCalled();
      
      // Should save relation fields
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(entities);
      expect(findByIdsSpy).toHaveBeenCalledWith(ids);
      expect(result).toEqual(refreshed);

      findByIdsSpy.mockRestore();
    });
  });

  describe('bulkRemove', () => {
    it('should remove multiple entities and return the removed records', async () => {
      const ids = [6, 7];
      const entities = [{ id: 6 }, { id: 7 }];

      mockWaterlineQueryService.findWithModifiers.mockResolvedValue(entities);
      mockRepository.softDelete.mockResolvedValue({});

      const result = await service.bulkRemove(ids);

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        populate: undefined,
        select: undefined,
        omit: undefined,
      });
      expect(mockRepository.softDelete).toHaveBeenCalledWith(ids);
      expect(result).toEqual(entities);
    });
  });

  describe('count', () => {
    it('should call waterlineQueryService countWithModifiers and return count', async () => {
      const expectedCount = 5;
      mockWaterlineQueryService.countWithModifiers.mockResolvedValue(expectedCount);

      const result = await service.count({});

      expect(mockWaterlineQueryService.countWithModifiers).toHaveBeenCalledWith({});
      expect(result).toBe(expectedCount);
    });
  });

  describe('exists', () => {
    it('should return true when count is greater than zero', async () => {
      mockRepository.count.mockResolvedValue(2);

      const result = await service.exists(1);

      expect(mockRepository.count).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(true);
    });

    it('should return false when count is zero', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists(2);

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore entity and return fresh value', async () => {
      const id = 8;
      const entity = { id };

      mockRepository.restore.mockResolvedValue({});
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([entity]);

      const result = await service.restore(id);

      expect(mockRepository.restore).toHaveBeenCalledWith(id);
      expect(result).toEqual(entity);
    });
  });
});
