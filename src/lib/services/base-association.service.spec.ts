import { NotFoundException } from '@nestjs/common';
import { BaseAssociationService } from './base-association.service';
import type { Criteria, CountCriteria } from '../interfaces/crud.interfaces';

describe('BaseAssociationService', () => {
  let service: BaseAssociationService<any, any>;
  let parentWaterlineQueryService: any;
  let childWaterlineQueryService: any;
  let parentRepository: any;
  let childRepository: any;
  let relationConfig: any;
  let relationBuilder: any;
  let relationOperator: any;

  beforeEach(() => {
    relationConfig = {
      propertyName: 'children',
      isManyToMany: true,
      isOneToMany: true,
      isManyToOne: false,
      isOneToOne: false,
      inverseRelation: { propertyName: 'parent' },
      joinColumns: [{ propertyName: 'parentId', databaseName: 'parent_id' }],
    };

    parentRepository = {
      metadata: {
        name: 'ParentEntity',
        relations: [relationConfig],
        findRelationWithPropertyPath: jest.fn().mockImplementation(path => {
          return path === relationConfig.propertyName ? relationConfig : undefined;
        }),
      },
      save: jest.fn(),
    };

    relationOperator = {
      add: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      loadMany: jest.fn().mockResolvedValue([]),
      loadOne: jest.fn().mockResolvedValue(null),
    };

    relationBuilder = {
      of: jest.fn().mockReturnValue(relationOperator),
    };

    parentRepository.createQueryBuilder = jest.fn().mockReturnValue({
      relation: jest.fn().mockReturnValue(relationBuilder),
    });

    childRepository = {
      metadata: {
        name: 'ChildEntity',
        relations: [],
      },
    };

    parentWaterlineQueryService = {
      getRepository: jest.fn().mockReturnValue(parentRepository),
      findWithModifiers: jest.fn(),
    };

    childWaterlineQueryService = {
      getRepository: jest.fn().mockReturnValue(childRepository),
      findWithModifiers: jest.fn(),
      countWithModifiers: jest.fn(),
    };

    service = new BaseAssociationService(parentWaterlineQueryService, childWaterlineQueryService);
  });

  describe('addAssociation', () => {
    it('should append child for collection relations and persist', async () => {
      const parentRecord = { id: 1, children: [] };
      const enrichedRecord = { id: 1, children: [{ id: 10 }] };

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([enrichedRecord]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 10 }]);

      const result = await service.addAssociation(1, 'children', 10);

      expect(parentWaterlineQueryService.findWithModifiers).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        populate: ['children'],
        select: undefined,
        omit: undefined,
        limit: 1,
      });
      expect(childWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: 10 },
        limit: 1,
      });
      expect(relationBuilder.of).toHaveBeenCalledWith(1);
      expect(relationOperator.add).toHaveBeenCalledWith(10);
      expect(result).toEqual(enrichedRecord);
    });

    it('should avoid duplicate association and skip save', async () => {
      const parentRecord = { id: 1, children: [{ id: 10 }] };

      relationOperator.loadMany.mockResolvedValueOnce(parentRecord.children);

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([parentRecord]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 10 }]);

      await service.addAssociation(1, 'children', 10);

      expect(relationOperator.add).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when child is missing', async () => {
      parentWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 1 }]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([]);

      await expect(service.addAssociation(1, 'children', 10)).rejects.toThrow(
        new NotFoundException('Child record with id 10 not found'),
      );
    });

    it('should throw error when relation missing', async () => {
      parentRepository.metadata.findRelationWithPropertyPath.mockReturnValue(undefined);
      parentWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 1 }]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 10 }]);

      await expect(service.addAssociation(1, 'children', 10)).rejects.toThrow(
        "Association 'children' not found in ParentEntity",
      );
    });
  });

  describe('removeAssociation', () => {
    it('should detach child from collection relation', async () => {
      const parentRecord = { id: 1, children: [{ id: 10 }, { id: 20 }] };
      const cleanedRecord = { id: 1, children: [{ id: 20 }] };

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([cleanedRecord]);

      const result = await service.removeAssociation(1, 'children', 10);

      expect(relationOperator.remove).toHaveBeenCalledWith(10);
      expect(result).toEqual(cleanedRecord);
    });

    it('should nullify reference for single relation types', async () => {
      relationConfig.isManyToMany = false;
      relationConfig.isOneToMany = false;
      relationConfig.isManyToOne = true;
      const parentRecord = { id: 1, children: { id: 10 } };
      const updatedRecord = { id: 1, children: null };

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([updatedRecord]);

      const result = await service.removeAssociation(1, 'children', 10);

      expect(relationOperator.set).toHaveBeenCalledWith(null);
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('replaceAssociations', () => {
    it('should set collection associations based on provided ids', async () => {
      const parentRecord = { id: 1, children: [] };
      const hydratedRecord = { id: 1, children: [{ id: 10 }, { id: 20 }] };

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([hydratedRecord]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 10 }, { id: 20 }]);

      const result = await service.replaceAssociations(1, 'children', [10, 20]);

      expect(childWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { id: { in: [10, 20] } },
      });
      expect(relationOperator.set).toHaveBeenCalledWith([10, 20]);
      expect(result).toEqual(hydratedRecord);
    });

    it('should clear association when empty ids array provided', async () => {
      const parentRecord = { id: 1, children: [{ id: 10 }] };
      const refreshedRecord = { id: 1, children: [] };

      parentWaterlineQueryService.findWithModifiers
        .mockResolvedValueOnce([parentRecord])
        .mockResolvedValueOnce([refreshedRecord]);

      const result = await service.replaceAssociations(1, 'children', []);

      expect(relationOperator.set).toHaveBeenCalledWith([]);
      expect(result).toEqual(refreshedRecord);
    });

    it('should throw when some child records are missing', async () => {
      const parentRecord = { id: 1, children: [] };

      parentWaterlineQueryService.findWithModifiers.mockResolvedValue([parentRecord]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue([{ id: 10 }]);

      await expect(service.replaceAssociations(1, 'children', [10, 20])).rejects.toThrow(
        new NotFoundException('Some child records not found'),
      );
    });
  });

  describe('findAssociations', () => {
    it('should query child service with merged where clause', async () => {
      relationConfig.inverseRelation = { propertyName: 'parent' };
      const parentRecord = { id: 1 };
      const criteria: Criteria = { where: { status: 'active' }, limit: 5 };
      const expected = [{ id: 11 }];

      relationOperator.loadMany.mockResolvedValueOnce([{ id: 11 }]);
      parentWaterlineQueryService.findWithModifiers.mockResolvedValue([parentRecord]);
      childWaterlineQueryService.findWithModifiers.mockResolvedValue(expected);

      const result = await service.findAssociations(1, 'children', criteria);

      expect(childWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith({
        where: { and: [{ status: 'active' }, { id: { in: [11] } }] },
        limit: 5,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('countAssociations', () => {
    it('should delegate to child service with merged criteria', async () => {
      relationConfig.inverseRelation = { propertyName: 'parent' };
      const parentRecord = { id: 1 };
      const criteria: CountCriteria = { where: { status: 'active' } };

      relationOperator.loadMany.mockResolvedValueOnce([{ id: 11 }]);
      parentWaterlineQueryService.findWithModifiers.mockResolvedValue([parentRecord]);
      childWaterlineQueryService.countWithModifiers.mockResolvedValue(3);

      const result = await service.countAssociations(1, 'children', criteria);

      expect(childWaterlineQueryService.countWithModifiers).toHaveBeenCalledWith({
        where: { and: [{ status: 'active' }, { id: { in: [11] } }] },
      });
      expect(result).toBe(3);
    });
  });
});
