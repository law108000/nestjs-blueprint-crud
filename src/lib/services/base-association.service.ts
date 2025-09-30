import { Injectable, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { BaseEntity } from '../entities/base.entity';
import { WaterlineQueryService } from './waterline-query.service';
import { BaseService } from './base.service';
import type { Criteria, CountCriteria } from '../interfaces/crud.interfaces';

@Injectable()
export class BaseAssociationService<Parent extends BaseEntity, Child extends BaseEntity> extends BaseService<Parent> {
  private parentRepository: Repository<Parent>;
  private childRepository: Repository<Child>;

  constructor(
    parentWaterlineQueryService: WaterlineQueryService<Parent>,
    private readonly childWaterlineQueryService: WaterlineQueryService<Child>
  ) {
    super(parentWaterlineQueryService);
    this.parentRepository = parentWaterlineQueryService.getRepository();
    this.childRepository = childWaterlineQueryService.getRepository();
  }

  async addAssociation(id: number, association: string, fk: number): Promise<Parent> {
    const parentRecord = await this.findOne(id);
    if (!parentRecord) {
      throw new NotFoundException(`Parent record with id ${id} not found`);
    }

    const childRecord = await this.childWaterlineQueryService.findWithModifiers({
      where: { id: fk },
      limit: 1,
    });

    if (!childRecord || childRecord.length === 0) {
      throw new NotFoundException(`Child record with id ${fk} not found`);
    }

    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(`Association '${association}' not found in ${this.parentRepository.metadata.name}`);
    }

    try {
      if (relation.isManyToMany || relation.isOneToMany) {
        const currentAssociations = (parentRecord as any)[association] || [];
        const existingAssociation = currentAssociations.find((item: any) => item.id === fk);
        
        if (!existingAssociation) {
          currentAssociations.push(childRecord[0]);
          (parentRecord as any)[association] = currentAssociations;
          await this.parentRepository.save(parentRecord);
        }
      } else if (relation.isManyToOne || relation.isOneToOne) {
        (parentRecord as any)[association] = childRecord[0];
        await this.parentRepository.save(parentRecord);
      }

      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error adding association:', error);
      throw error;
    }
  }

  async removeAssociation(id: number, association: string, fk: number): Promise<Parent> {
    const parentRecord = await this.findOne(id);
    if (!parentRecord) {
      throw new NotFoundException(`Parent record with id ${id} not found`);
    }

    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(`Association '${association}' not found in ${this.parentRepository.metadata.name}`);
    }

    try {
      if (relation.isManyToMany || relation.isOneToMany) {
        const currentAssociations = (parentRecord as any)[association] || [];
        const filteredAssociations = currentAssociations.filter((item: any) => item.id !== fk);
        (parentRecord as any)[association] = filteredAssociations;
        await this.parentRepository.save(parentRecord);
      } else if (relation.isManyToOne || relation.isOneToOne) {
        (parentRecord as any)[association] = null;
        await this.parentRepository.save(parentRecord);
      }

      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error removing association:', error);
      throw error;
    }
  }

  async replaceAssociations(id: number, association: string, fks: number[]): Promise<Parent> {
    const parentRecord = await this.findOne(id);
    if (!parentRecord) {
      throw new NotFoundException(`Parent record with id ${id} not found`);
    }

    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(`Association '${association}' not found in ${this.parentRepository.metadata.name}`);
    }

    try {
      if (fks.length > 0) {
        const childRecords = await this.childWaterlineQueryService.findWithModifiers({
          where: { id: { in: fks } },
        });

        if (childRecords.length !== fks.length) {
          throw new NotFoundException('Some child records not found');
        }

        if (relation.isManyToMany || relation.isOneToMany) {
          (parentRecord as any)[association] = childRecords;
        } else if (relation.isManyToOne || relation.isOneToOne) {
          (parentRecord as any)[association] = childRecords[0];
        }
      } else {
        (parentRecord as any)[association] = relation.isManyToMany || relation.isOneToMany ? [] : null;
      }

      await this.parentRepository.save(parentRecord);
      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error replacing associations:', error);
      throw error;
    }
  }

  async findAssociations(id: number, association: string, query: Criteria): Promise<Child[]> {
    const parentRecord = await this.findOne(id);
    if (!parentRecord) {
      throw new NotFoundException(`Parent record with id ${id} not found`);
    }

    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(`Association '${association}' not found in ${this.parentRepository.metadata.name}`);
    }

    const criteria: Criteria = {
      where: {
        [relation.inverseRelation?.propertyName || 'id']: parentRecord.id,
        ...query.where,
      },
      ...query,
    };

    return this.childWaterlineQueryService.findWithModifiers(criteria);
  }

  async countAssociations(id: number, association: string, query: CountCriteria): Promise<number> {
    const parentRecord = await this.findOne(id);
    if (!parentRecord) {
      throw new NotFoundException(`Parent record with id ${id} not found`);
    }

    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(`Association '${association}' not found in ${this.parentRepository.metadata.name}`);
    }

    const criteria: CountCriteria = {
      where: {
        [relation.inverseRelation?.propertyName || 'id']: parentRecord.id,
        ...query.where,
      }
    };

    return this.childWaterlineQueryService.countWithModifiers(criteria);
  }
}