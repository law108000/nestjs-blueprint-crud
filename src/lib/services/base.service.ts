import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseEntity } from '../entities/base.entity';
import { WaterlineQueryService } from './waterline-query.service';
import { Criteria } from '../interfaces/crud.interfaces';

@Injectable()
export class BaseService<T extends BaseEntity> {
  private repository: Repository<T>;
  protected readonly logger = new Logger(BaseService.name);

  constructor(
    private readonly waterlineQueryService: WaterlineQueryService<T>
  ) {
    this.repository = waterlineQueryService.getRepository();
  }

  async findOne(id: number, populate?: string, select?: string, omit?: string): Promise<T> {
    if (id == null) {
      throw new NotFoundException('ID must be provided');
    }

    const entities = await this.waterlineQueryService.findWithModifiers({
      where: { id },
      populate:
        populate 
          ? populate.split(',').map(rel => rel.trim()) 
          : this.repository.metadata.relations.map(rel => rel.propertyName),
      select: select,
      omit: omit,
      limit: 1,
    });

    if (!entities || entities.length === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    return entities[0];
  }

  async findOneBy(where: Criteria<T>["where"], populate?: string|string[]): Promise<T|null> {
    if (!populate) {
      populate = [];
      const relations = this.repository.metadata.relations;
      relations.forEach(relation => {
        (populate as string[]).push(relation.propertyName);
      });
    } else if (typeof populate === 'string') {
      populate = populate.split(',').map(rel => rel.trim());
    }

    const entities = await this.waterlineQueryService.findWithModifiers({
      where: where,
      populate,
      limit: 1,
    });

    if (!entities || entities.length === 0) {
      return null;
    }
    return entities[0];
  }

  async find(criteria: Criteria<T>): Promise<T[]> {
    this.logger.debug('Find criteria:', criteria);
    return this.waterlineQueryService.findWithModifiers(criteria);
  }

  async findByIds(ids: number[], populate?: string, select?: string, omit?: string): Promise<T[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.waterlineQueryService.findWithModifiers({
      where: { id: { in: ids } },
      populate: populate ? populate.split(',').map(rel => rel.trim()) : undefined,
      select: select,
      omit: omit,
    });
  }

  async create(entityData: Partial<T>): Promise<T> {
    this.logger.debug('Creating entity with data:', entityData);
    
    const entity = this.repository.create(entityData as any);
    const savedEntity = await this.repository.save(entity);
    
    return this.findOne((savedEntity as any).id);
  }

  async update(id: number, entityData: Partial<T>): Promise<T> {
    this.logger.debug(`Updating entity ${id} with data:`, entityData);
    
    const existingEntity = await this.findOne(id);
    if (!existingEntity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    await this.repository.update(id, entityData as QueryDeepPartialEntity<T>);
    return this.findOne(id);
  }

  async remove(id: number): Promise<T> {
    this.logger.debug(`Removing entity with id: ${id}`);
    
    const entity = await this.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    await this.repository.softDelete(id);
    return entity;
  }

  async bulkCreate(entitiesData: Partial<T>[]): Promise<T[]> {
    this.logger.debug('Bulk creating entities:', entitiesData);
    
    const entities = this.repository.create(entitiesData as any);
    const savedEntities = await this.repository.save(entities);
    
    const ids = savedEntities.map(entity => (entity as any).id);
    return this.findByIds(ids);
  }

  async bulkUpdate(ids: number[], entityData: Partial<T>): Promise<T[]> {
    this.logger.debug(`Bulk updating entities ${ids.join(', ')} with data:`, entityData);
    
    await this.repository.update({ id: In(ids) } as FindOptionsWhere<T>, entityData as QueryDeepPartialEntity<T>);
    return this.findByIds(ids);
  }

  async bulkRemove(ids: number[]): Promise<T[]> {
    this.logger.debug(`Bulk removing entities with ids: ${ids.join(', ')}`);
    
    const entities = await this.findByIds(ids);
    await this.repository.softDelete(ids);
    return entities;
  }

  async count(criteria: Criteria): Promise<number> {
    this.logger.debug('Count criteria:', criteria);
    return this.waterlineQueryService.countWithModifiers(criteria);
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as FindOptionsWhere<T> });
    return count > 0;
  }

  async restore(id: number): Promise<T> {
    this.logger.debug(`Restoring entity with id: ${id}`);
    
    await this.repository.restore(id);
    return this.findOne(id);
  }
}