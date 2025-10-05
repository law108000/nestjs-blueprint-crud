import type { DataSource } from 'typeorm';
import { WaterlineQueryService } from './waterline-query.service';

describe('WaterlineQueryService', () => {
  let dataSource: DataSource;
  let repository: any;
  let queryBuilder: any;
  let service: WaterlineQueryService<any>;

  beforeEach(() => {
    const columns = [
      { propertyPath: 'id' },
      { propertyPath: 'name' },
      { propertyPath: 'status' },
      { propertyPath: 'age' },
    ];

    const relation = {
      propertyName: 'children',
      inverseRelation: { propertyName: 'parent' },
      joinColumns: [{ propertyName: 'parentId', databaseName: 'parent_id' }],
    };

    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        raw: [{ entity_parent_id: 42 }],
        entities: [{ id: 1, name: 'Alice' }],
      }),
      getCount: jest.fn().mockResolvedValue(3),
    };

    repository = {
      metadata: {
        name: 'TestEntity',
        relations: [relation],
        columns,
        findRelationWithPropertyPath: jest
          .fn()
          .mockImplementation(path => (path === 'children' ? relation : undefined)),
        findColumnWithPropertyPath: jest.fn().mockImplementation(property => {
          return columns.find(column => column.propertyPath === property) || null;
        }),
      },
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    dataSource = {
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as DataSource;

    class TestEntity {}

    service = new WaterlineQueryService<any>(dataSource, TestEntity as any);
  });

  it('should expose repository via getRepository', () => {
    expect(service.getRepository()).toBe(repository);
  });

  it('should build query with relations, selection, and pagination', async () => {
    const result = await service.findWithModifiers({
      where: {
        name: 'Alice',
        or: [{ status: { '>': 0 } }],
      },
      populate: 'children',
      select: 'name',
      limit: 5,
      skip: 10,
      sort: 'name DESC',
    });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('entity');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'entity.children',
      'populate_children',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalled();
    expect(queryBuilder.orWhere).toHaveBeenCalled();
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('entity.name', 'DESC');
    expect(queryBuilder.select).toHaveBeenCalledWith([
      'entity.id',
      'entity.name',
      'populate_children',
    ]);
    expect(result).toEqual([{ id: 1, name: 'Alice', parentId: 42 }]);
  });

  it('should support omission of fields and sort array syntax', async () => {
    await service.findWithModifiers({
      omit: 'status',
      sort: [{ id: 'ASC' }, { name: 'DESC' }],
      populate: ['children'],
    });

    expect(queryBuilder.select).toHaveBeenCalledWith([
      'entity.id',
      'entity.name',
      'entity.age',
      'populate_children',
    ]);
    expect(queryBuilder.orderBy).not.toHaveBeenCalled();
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('entity.id', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('entity.name', 'DESC');
  });

  it('should count entities using criteria', async () => {
    const count = await service.countWithModifiers({
      where: { status: 'active' },
    });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('entity');
    expect(queryBuilder.andWhere).toHaveBeenCalled();
    expect(count).toBe(3);
  });

  describe('query criteria modifiers', () => {
    it('should apply "<" modifier', async () => {
      await service.findWithModifiers({
        where: { age: { '<': 30 } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.age <'),
        expect.any(Object),
      );
    });

    it('should apply "<=" modifier', async () => {
      await service.findWithModifiers({
        where: { age: { '<=': 25 } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.age <='),
        expect.any(Object),
      );
    });

    it('should apply ">" modifier', async () => {
      await service.findWithModifiers({
        where: { age: { '>': 18 } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.age >'),
        expect.any(Object),
      );
    });

    it('should apply ">=" modifier', async () => {
      await service.findWithModifiers({
        where: { age: { '>=': 21 } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.age >='),
        expect.any(Object),
      );
    });

    it('should apply "!=" modifier', async () => {
      await service.findWithModifiers({
        where: { status: { '!=': 'inactive' } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.status !='),
        expect.any(Object),
      );
    });

    it('should apply "in" modifier', async () => {
      await service.findWithModifiers({
        where: { status: { in: ['active', 'pending'] } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.status IN'),
        expect.any(Object),
      );
    });

    it('should apply "nin" modifier', async () => {
      await service.findWithModifiers({
        where: { status: { nin: ['inactive', 'banned'] } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.status NOT IN'),
        expect.any(Object),
      );
    });

    it('should apply "contains" modifier', async () => {
      await service.findWithModifiers({
        where: { name: { contains: 'john' } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.name LIKE'),
        expect.any(Object),
      );
    });

    it('should apply "startsWith" modifier', async () => {
      await service.findWithModifiers({
        where: { name: { startsWith: 'John' } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.name LIKE'),
        expect.any(Object),
      );
    });

    it('should apply "endsWith" modifier', async () => {
      await service.findWithModifiers({
        where: { name: { endsWith: 'son' } },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entity.name LIKE'),
        expect.any(Object),
      );
    });
  });

  describe('complex queries', () => {
    it('should handle "or" conditions', async () => {
      await service.findWithModifiers({
        where: {
          or: [{ status: 'active' }, { age: { '>': 25 } }],
        },
      });

      expect(queryBuilder.orWhere).toHaveBeenCalled();
    });

    it('should handle "and" conditions', async () => {
      await service.findWithModifiers({
        where: {
          and: [{ status: 'active' }, { age: { '>': 18 } }],
        },
      });

      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should handle nested criteria with modifiers', async () => {
      await service.findWithModifiers({
        where: {
          or: [{ name: { contains: 'john' } }, { age: { '>': 30 }, status: 'active' }],
        },
      });

      expect(queryBuilder.orWhere).toHaveBeenCalled();
    });
  });

  describe('query options', () => {
    it('should handle pagination with limit and skip', async () => {
      await service.findWithModifiers({
        limit: 20,
        skip: 40,
      });

      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.skip).toHaveBeenCalledWith(40);
    });

    it('should handle string sort with DESC', async () => {
      await service.findWithModifiers({
        sort: 'createdAt DESC',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('entity.createdAt', 'DESC');
    });

    it('should handle string sort with ASC', async () => {
      await service.findWithModifiers({
        sort: 'name ASC',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('entity.name', 'ASC');
    });

    it('should handle string sort without direction (defaults to ASC)', async () => {
      await service.findWithModifiers({
        sort: 'name',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('entity.name', 'ASC');
    });

    it('should handle select fields', async () => {
      await service.findWithModifiers({
        select: 'id,name,email',
      });

      expect(queryBuilder.select).toHaveBeenCalledWith([
        'entity.id',
        'entity.name',
        'entity.email',
      ]);
    });

    it('should handle omit fields', async () => {
      await service.findWithModifiers({
        omit: 'name,status',
      });

      expect(queryBuilder.select).toHaveBeenCalledWith(['entity.id', 'entity.age']);
    });

    it('should handle populate as string', async () => {
      await service.findWithModifiers({
        populate: 'children',
      });

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entity.children',
        'populate_children',
      );
    });

    it('should handle populate as array', async () => {
      await service.findWithModifiers({
        populate: ['children'],
      });

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entity.children',
        'populate_children',
      );
    });
  });
});
