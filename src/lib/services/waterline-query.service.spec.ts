import type { DataSource } from 'typeorm';
import { WaterlineQueryService } from './waterline-query.service';

describe('WaterlineQueryService', () => {
  let dataSource: DataSource;
  let repository: any;
  let queryBuilder: any;
  let service: WaterlineQueryService<any>;

  beforeEach(() => {
    const columns = [{ propertyPath: 'id' }, { propertyPath: 'name' }, { propertyPath: 'status' }];

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
});
