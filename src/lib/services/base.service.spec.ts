import { BaseService } from './base.service';

describe('BaseService', () => {
  let service: BaseService<any>;
  let mockRepository: any;
  let mockWaterlineQueryService: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      metadata: {
        relations: [
          { propertyName: 'relation1' },
          { propertyName: 'relation2' }
        ]
      }
    };
    
    mockWaterlineQueryService = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      findWithModifiers: jest.fn().mockResolvedValue([]),
      countWithModifiers: jest.fn().mockResolvedValue(0),
    };
    
    service = new BaseService(mockWaterlineQueryService);
  });

  describe('find', () => {
    it('should call waterlineQueryService findWithModifiers with correct parameters', async () => {
      const options = { where: { name: 'test' } };
      mockWaterlineQueryService.findWithModifiers.mockResolvedValue([]);

      await service.find(options);

      expect(mockWaterlineQueryService.findWithModifiers).toHaveBeenCalledWith(options);
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

  describe('count', () => {
    it('should call waterlineQueryService countWithModifiers and return count', async () => {
      const expectedCount = 5;
      mockWaterlineQueryService.countWithModifiers.mockResolvedValue(expectedCount);

      const result = await service.count({});

      expect(mockWaterlineQueryService.countWithModifiers).toHaveBeenCalledWith({});
      expect(result).toBe(expectedCount);
    });
  });
});