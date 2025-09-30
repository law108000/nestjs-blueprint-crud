import { Injectable, Logger } from '@nestjs/common';
import { DataSource, type Repository, type SelectQueryBuilder, type FindOperator, type WhereExpressionBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { Criteria, CountCriteria, EntityWhereCriteria} from '../interfaces/crud.interfaces';
import type { BaseEntity } from '../entities/base.entity';

@Injectable()
export class WaterlineQueryService<T extends BaseEntity> {
  private readonly logger = new Logger(WaterlineQueryService.name);
  private stringColumnsCache: { [key: string]: boolean } = {};
  private lastExecutedQuery: SelectQueryBuilder<T> | null = null;
  private repository: Repository<T>;

  constructor(
    private readonly dataSource: DataSource,
    private entityClass: new () => T
  ) {
    this.repository = this.dataSource.getRepository(this.entityClass);
  }

  public getRepository(): Repository<T> {
    return this.repository;
  }

  private isFindOperator(value: any): value is FindOperator<any> {
    return value && typeof value === 'object' && 
      (value['@instanceof'] === Symbol.for('FindOperator') || 
      (value._type !== undefined && value._value !== undefined && value._useParameter !== undefined));
  }

  private applyFindOperator(
    query: WhereExpressionBuilder,
    operatorClause: 'andWhere' | 'orWhere',
    alias: string,
    key: string,
    findOperator: any
  ): void {
    const paramKey = uuidv4().replace(/-/g, '_');
    const type = findOperator._type;
    const value = findOperator._value;

    switch (type) {
      case 'equal':
        query[operatorClause](`${alias}.${key} = :${paramKey}`, { [paramKey]: value });
        break;
      case 'not':
        query[operatorClause](`${alias}.${key} != :${paramKey}`, { [paramKey]: value });
        break;
      case 'lessThan':
        query[operatorClause](`${alias}.${key} < :${paramKey}`, { [paramKey]: value });
        break;
      case 'lessThanOrEqual':
        query[operatorClause](`${alias}.${key} <= :${paramKey}`, { [paramKey]: value });
        break;
      case 'moreThan':
        query[operatorClause](`${alias}.${key} > :${paramKey}`, { [paramKey]: value });
        break;
      case 'moreThanOrEqual':
        query[operatorClause](`${alias}.${key} >= :${paramKey}`, { [paramKey]: value });
        break;
      case 'in':
        query[operatorClause](`${alias}.${key} IN (:...${paramKey})`, { [paramKey]: value });
        break;
      case 'not_in':
        query[operatorClause](`${alias}.${key} NOT IN (:...${paramKey})`, { [paramKey]: value });
        break;
      case 'like':
        query[operatorClause](`${alias}.${key} LIKE :${paramKey}`, { [paramKey]: value });
        break;
      case 'ilike':
        query[operatorClause](`LOWER(${alias}.${key}) LIKE LOWER(:${paramKey})`, { [paramKey]: value });
        break;
      case 'isNull':
        query[operatorClause](`${alias}.${key} IS NULL`);
        break;
      case 'isNotNull':
        query[operatorClause](`${alias}.${key} IS NOT NULL`);
        break;
      default:
        this.logger.warn(`Unsupported FindOperator type: ${type}`);
    }
  }

  private applyComparison(
    query: WhereExpressionBuilder,
    operatorClause: 'andWhere' | 'orWhere',
    alias: string,
    key: string,
    modifier: string,
    modifierValue: any
  ): void {
    const paramKey = uuidv4().replace(/-/g, '_');
    const paramObj: { [key: string]: any } = {};
    let condition: string = '';

    switch (modifier) {
      case '<':
        condition = `${alias}.${key} < :${paramKey}`;
        paramObj[paramKey] = modifierValue;
        break;
      case '<=':
        condition = `${alias}.${key} <= :${paramKey}`;
        paramObj[paramKey] = modifierValue;
        break;
      case '>':
        condition = `${alias}.${key} > :${paramKey}`;
        paramObj[paramKey] = modifierValue;
        break;
      case '>=':
        condition = `${alias}.${key} >= :${paramKey}`;
        paramObj[paramKey] = modifierValue;
        break;
      case '!=':
        condition = `${alias}.${key} != :${paramKey}`;
        paramObj[paramKey] = modifierValue;
        break;
      case 'in':
        condition = `${alias}.${key} IN (:...${paramKey})`;
        paramObj[paramKey] = modifierValue;
        break;
      case 'nin':
        condition = `${alias}.${key} NOT IN (:...${paramKey})`;
        paramObj[paramKey] = modifierValue;
        break;
      case 'contains':
        condition = `${alias}.${key} LIKE :${paramKey}`;
        paramObj[paramKey] = `%${modifierValue}%`;
        break;
      case 'startsWith':
        condition = `${alias}.${key} LIKE :${paramKey}`;
        paramObj[paramKey] = `${modifierValue}%`;
        break;
      case 'endsWith':
        condition = `${alias}.${key} LIKE :${paramKey}`;
        paramObj[paramKey] = `%${modifierValue}`;
        break;
      default:
        this.logger.warn(`Unsupported modifier: ${modifier}`);
        return;
    }

    query[operatorClause](condition, paramObj);
  }

  public applyCriteria(
    query: WhereExpressionBuilder,
    criteria: EntityWhereCriteria<T> | null = {},
    alias: string = 'entity',
    operator: 'and' | 'or' = 'and'
  ): void {
    if (!criteria) return;

    const operatorClause = operator === 'and' ? 'andWhere' : 'orWhere';
    const {metadata} = this.repository;

    for (const key in criteria) {
      if (key === 'and' || key === 'or') {
        const subCriteria = criteria[key] as EntityWhereCriteria<T>[];
        if (Array.isArray(subCriteria)) {
          subCriteria.forEach((subCriterion) => {
            this.applyCriteria(query, subCriterion, alias, key);
          });
        }
        continue;
      }

      const value = criteria[key];
      if (value === undefined) continue;

      const column = metadata.findColumnWithPropertyPath(key);
      if (!column) continue;

      if (this.isFindOperator(value)) {
        this.applyFindOperator(query, operatorClause, alias, key, value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const modifier in value) {
          const modifierValue = value[modifier];
          if (modifierValue !== undefined) {
            this.applyComparison(query, operatorClause, alias, key, modifier, modifierValue);
          }
        }
      } else {
        const paramKey = uuidv4().replace(/-/g, '_');
        query[operatorClause](`${alias}.${key} = :${paramKey}`, { [paramKey]: value });
      }
    }
  }

  public getLastExecutedQuery(): SelectQueryBuilder<T> | null {
    return this.lastExecutedQuery;
  }

  async findWithModifiers(criteria: Criteria, customQuery: SelectQueryBuilder<T> | null = null): Promise<T[]> {
    let query = customQuery || this.repository.createQueryBuilder('entity');
    let populateOptions: string[] = [];
    
    this.logger.debug(`Finding entities with criteria: ${JSON.stringify(criteria)}`);
    
    if (criteria?.populate) {
      this.logger.debug('populate criteria', criteria.populate);
      populateOptions = (typeof criteria.populate === 'string'
        ? criteria.populate.split(',')
        : criteria.populate
      ).map(field => field.trim());
      this.logger.debug('populate options', populateOptions);

      populateOptions.forEach((association: string) => {
        const relation = this.repository.metadata.findRelationWithPropertyPath(association);
        if (!relation) {
          throw new Error(`Invalid association "${association}" in "${this.repository.metadata.name}"`);
        }
        query = query.leftJoinAndSelect(`entity.${relation.propertyName}`, `populate_${  relation.propertyName}`);
      });
    }

    if (criteria?.where) {
      this.applyCriteria(query, criteria.where);
    }

    if (criteria?.limit) {
      query.take(criteria.limit);
    }

    if (criteria?.skip) {
      query.skip(criteria.skip);
    }

    if (criteria?.sort) {
      if (typeof criteria.sort === 'string') {
        const [field, direction] = criteria.sort.split(' ');
        query.orderBy(`entity.${field}`, direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
      } else {
        criteria.sort.forEach(sortOption => {
          for (const field in sortOption) {
            query.addOrderBy(`entity.${field}`, sortOption[field]);
          }
        });
      }
    }

    if (criteria?.select) {
      const selectFields = criteria.select.split(',').map(field => `entity.${field.trim()}`);
      if (!selectFields.some(field => field.includes('.id'))) {
        selectFields.unshift('entity.id');
      }
      if (criteria?.populate) {
        populateOptions.forEach((association: string) => {
          const relation = this.repository.metadata.findRelationWithPropertyPath(association);
          if (!relation) {
            throw new Error(`Invalid association: ${association}`);
          }
          selectFields.push(`populate_${relation.propertyName}`);
        });
      }
      query.select(selectFields);
    } else if (criteria?.omit) {
      const omitFields = criteria.omit.split(',').map(field => field.trim());
      const allColumns = this.repository.metadata.columns.map(column => column.propertyPath);
      const selectFields = allColumns
        .filter(column => !omitFields.includes(column))
        .map(field => `entity.${field}`);
      if (criteria?.populate) {
        populateOptions.forEach((association: string) => {
          const relation = this.repository.metadata.findRelationWithPropertyPath(association);
          if (!relation) {
            throw new Error(`Invalid association: ${association}`);
          }
          selectFields.push(`populate_${relation.propertyName}`);
        });
      }
      query.select(selectFields);
    }

    this.lastExecutedQuery = query;
    const { raw, entities } = await query.getRawAndEntities();

    for (let i = 0; i < entities.length; i++) {
      this.enhanceEntityWithForeignKeys(entities[i], raw[i], populateOptions);
    }
    
    return entities;
  }

  async countWithModifiers(criteria: CountCriteria): Promise<number> {
    this.logger.debug(`Counting entities with criteria: ${JSON.stringify(criteria)}`);
    
    const query = this.repository.createQueryBuilder('entity');
    
    if (criteria?.where) {
      this.applyCriteria(query, criteria.where);
    }
    
    this.lastExecutedQuery = query;
    return await query.getCount();
  }

  private enhanceEntityWithForeignKeys(entity: T, rawData: any, relationNames: string[]): void {
    if (!rawData || !relationNames.length) return;

    relationNames.forEach(relationName => {
      const relation = this.repository.metadata.findRelationWithPropertyPath(relationName);
      if (!relation) return;

      const foreignKeyColumn = relation.joinColumns?.[0];
      if (!foreignKeyColumn) return;

      const rawForeignKeyValue = rawData[`entity_${foreignKeyColumn.databaseName}`];
      if (rawForeignKeyValue !== null && rawForeignKeyValue !== undefined) {
        (entity as any)[foreignKeyColumn.propertyName] = rawForeignKeyValue;
      }
    });
  }
}