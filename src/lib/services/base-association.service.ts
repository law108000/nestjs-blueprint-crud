import { Injectable, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { RelationQueryBuilder } from 'typeorm/query-builder/RelationQueryBuilder';
import type { RelationMetadata } from 'typeorm/metadata/RelationMetadata';
import type { BaseEntity } from '../entities/base.entity';
import { WaterlineQueryService } from './waterline-query.service';
import { BaseService } from './base.service';
import type { Criteria, CountCriteria, EntityWhereCriteria } from '../interfaces/crud.interfaces';

@Injectable()
export class BaseAssociationService<
  Parent extends BaseEntity,
  Child extends BaseEntity,
> extends BaseService<Parent> {
  private parentRepository: Repository<Parent>;

  constructor(
    parentWaterlineQueryService: WaterlineQueryService<Parent>,
    private readonly childWaterlineQueryService: WaterlineQueryService<Child>,
  ) {
    super(parentWaterlineQueryService);
    this.parentRepository = parentWaterlineQueryService.getRepository();
  }

  async addAssociation(id: number, association: string, fk: number): Promise<Parent> {
    await this.ensureParentExists(id);

    const relation = this.getRelationMetadata(association);

    await this.ensureChildExists(fk);

    try {
      const relationBuilder = this.getParentRelationBuilder(relation);
      const existingRelations = await this.loadRelatedEntities(relation, relationBuilder, id);

      if (relation.isManyToMany || relation.isOneToMany) {
        const alreadyAssociated = existingRelations.some(child => child.id === fk);
        if (!alreadyAssociated) {
          await relationBuilder.of(id).add(fk);
        }
      } else {
        const existingChild = existingRelations[0];
        if (!existingChild || existingChild.id !== fk) {
          await relationBuilder.of(id).set(fk);
        }
      }

      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error adding association:', error);
      throw error;
    }
  }

  async removeAssociation(id: number, association: string, fk: number): Promise<Parent> {
    await this.ensureParentExists(id);

    const relation = this.getRelationMetadata(association);

    try {
      const relationBuilder = this.getParentRelationBuilder(relation);

      if (relation.isManyToMany || relation.isOneToMany) {
        await relationBuilder.of(id).remove(fk);
      } else {
        await relationBuilder.of(id).set(null);
      }

      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error removing association:', error);
      throw error;
    }
  }

  async replaceAssociations(id: number, association: string, fks: number[]): Promise<Parent> {
    await this.ensureParentExists(id);

    const relation = this.getRelationMetadata(association);

    const normalizedIds = Array.from(
      new Set(fks.map(fk => Number(fk)).filter(fk => !Number.isNaN(fk))),
    );

    if (normalizedIds.length > 0) {
      const childRecords = await this.childWaterlineQueryService.findWithModifiers({
        where: { id: { in: normalizedIds } },
      });

      if (childRecords.length !== normalizedIds.length) {
        throw new NotFoundException('Some child records not found');
      }
    }

    try {
      const relationBuilder = this.getParentRelationBuilder(relation);

      if (relation.isManyToMany) {
        await relationBuilder.of(id).set(normalizedIds);
      } else if (relation.isOneToMany) {
        const existingChildren = await this.loadRelatedEntities(relation, relationBuilder, id);
        const existingIds = existingChildren.map(child => child.id);

        const idsToRemove = existingIds.filter(existingId => !normalizedIds.includes(existingId));
        if (idsToRemove.length > 0) {
          await relationBuilder.of(id).remove(idsToRemove);
        }

        const idsToAdd = normalizedIds.filter(childId => !existingIds.includes(childId));
        if (idsToAdd.length > 0) {
          await relationBuilder.of(id).add(idsToAdd);
        }
      } else {
        const value = normalizedIds[0] ?? null;
        await relationBuilder.of(id).set(value);
      }

      return this.findOne(id, relation.propertyName);
    } catch (error) {
      this.logger.error('Error replacing associations:', error);
      throw error;
    }
  }

  async findAssociations(id: number, association: string, query: Criteria): Promise<Child[]> {
    await this.ensureParentExists(id);

    const relation = this.getRelationMetadata(association);
    const relationBuilder = this.getParentRelationBuilder(relation);

    const relatedEntities = await this.loadRelatedEntities(relation, relationBuilder, id);
    const relatedIds = Array.from(new Set(relatedEntities.map(child => child.id)));

    if (relatedIds.length === 0) {
      return [];
    }

    const associationWhere = { id: { in: relatedIds } } as EntityWhereCriteria<Child>;
    const combinedWhere: EntityWhereCriteria<Child> = query.where
      ? { and: [query.where as EntityWhereCriteria<Child>, associationWhere] }
      : associationWhere;

    const criteria: Criteria = {
      ...query,
      where: combinedWhere,
    };

    return this.childWaterlineQueryService.findWithModifiers(criteria);
  }

  async countAssociations(id: number, association: string, query: CountCriteria): Promise<number> {
    await this.ensureParentExists(id);

    const relation = this.getRelationMetadata(association);
    const relationBuilder = this.getParentRelationBuilder(relation);

    const relatedEntities = await this.loadRelatedEntities(relation, relationBuilder, id);
    const relatedIds = Array.from(new Set(relatedEntities.map(child => child.id)));

    if (relatedIds.length === 0) {
      return 0;
    }

    const associationWhere = { id: { in: relatedIds } } as EntityWhereCriteria<Child>;
    const combinedWhere: EntityWhereCriteria<Child> = query.where
      ? { and: [query.where as EntityWhereCriteria<Child>, associationWhere] }
      : associationWhere;

    const criteria: CountCriteria = {
      where: combinedWhere,
    };

    return this.childWaterlineQueryService.countWithModifiers(criteria);
  }

  private getRelationMetadata(association: string): RelationMetadata {
    const relation = this.parentRepository.metadata.findRelationWithPropertyPath(association);
    if (!relation) {
      throw new Error(
        `Association '${association}' not found in ${this.parentRepository.metadata.name}`,
      );
    }
    return relation;
  }

  private getParentRelationBuilder(relation: RelationMetadata): RelationQueryBuilder<Parent> {
    return this.parentRepository
      .createQueryBuilder()
      .relation(this.parentRepository.metadata.target, relation.propertyPath);
  }

  private async loadRelatedEntities(
    relation: RelationMetadata,
    relationBuilder: RelationQueryBuilder<Parent>,
    id: number,
  ): Promise<Child[]> {
    const relationOperator = relationBuilder.of(id);

    if (relation.isManyToMany || relation.isOneToMany) {
      return ((await relationOperator.loadMany()) ?? []) as Child[];
    }

    const related = (await relationOperator.loadOne()) as Child | null;
    return related ? [related] : [];
  }

  private async ensureParentExists(id: number): Promise<void> {
    await this.findOne(id);
  }

  private async ensureChildExists(fk: number): Promise<void> {
    const childRecord = await this.childWaterlineQueryService.findWithModifiers({
      where: { id: fk },
      limit: 1,
    });

    if (!childRecord || childRecord.length === 0) {
      throw new NotFoundException(`Child record with id ${fk} not found`);
    }
  }
}
