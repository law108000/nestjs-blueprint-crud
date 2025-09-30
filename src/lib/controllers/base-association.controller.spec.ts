import { BaseAssociationController } from './base-association.controller';
import type { BaseAssociationService } from '../services/base-association.service';

describe('BaseAssociationController', () => {
  let controller: BaseAssociationController<any, any>;
  let service: jest.Mocked<BaseAssociationService<any, any>>;

  beforeEach(() => {
    service = {
      findAssociations: jest.fn(),
      countAssociations: jest.fn(),
      addAssociation: jest.fn(),
      replaceAssociations: jest.fn(),
      removeAssociation: jest.fn(),
    } as unknown as jest.Mocked<BaseAssociationService<any, any>>;

    controller = new BaseAssociationController(service, 'children');
  });

  it('should delegate find queries with parsed criteria', async () => {
    const expected = [{ id: 1 }];
    service.findAssociations.mockResolvedValue(expected);

    const result = await controller.findAssociations(5, {
      where: JSON.stringify({ status: 'active' }),
      limit: 10,
      skip: 20,
      sort: 'name',
      select: 'id',
      omit: 'secret',
      populate: 'parent',
    } as any);

    expect(service.findAssociations).toHaveBeenCalledWith(5, 'children', {
      where: { status: 'active' },
      limit: 10,
      skip: 20,
      sort: 'name',
      select: 'id',
      omit: 'secret',
      populate: 'parent',
    });
    expect(result).toEqual(expected);
  });

  it('should count associations and wrap result', async () => {
    service.countAssociations.mockResolvedValue(7);

    const result = await controller.countAssociations(3, {
      where: JSON.stringify({ status: 'active' }),
    } as any);

    expect(service.countAssociations).toHaveBeenCalledWith(3, 'children', {
      where: { status: 'active' },
    });
    expect(result).toEqual({ count: 7 });
  });

  it('should add an association', async () => {
    const parent = { id: 1 };
    service.addAssociation.mockResolvedValue(parent);

    const result = await controller.addAssociation(1, 10);

    expect(service.addAssociation).toHaveBeenCalledWith(1, 'children', 10);
    expect(result).toBe(parent);
  });

  it('should replace associations', async () => {
    const parent = { id: 1 };
    service.replaceAssociations.mockResolvedValue(parent);

    const result = await controller.replaceAssociations(1, { ids: [10, 11] } as any);

    expect(service.replaceAssociations).toHaveBeenCalledWith(1, 'children', [10, 11]);
    expect(result).toBe(parent);
  });

  it('should remove an association', async () => {
    const parent = { id: 1 };
    service.removeAssociation.mockResolvedValue(parent);

    const result = await controller.removeAssociation(2, 9);

    expect(service.removeAssociation).toHaveBeenCalledWith(2, 'children', 9);
    expect(result).toBe(parent);
  });
});
