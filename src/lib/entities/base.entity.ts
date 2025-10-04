import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  type ValueTransformer,
} from 'typeorm';
import { IsOptional } from 'class-validator';

export class DateTransformer implements ValueTransformer {
  private allowNull: boolean;

  constructor(allowNull: boolean = false) {
    this.allowNull = allowNull;
  }

  to(value: Date | number | null): Date | null {
    if (!value && this.allowNull) {
      return null;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    return value;
  }

  from(value: string | number): number | null {
    if (!value && this.allowNull) {
      return null;
    }
    return typeof value === 'number' ? value : Date.parse(value);
  }
}

export class BooleanTransformer implements ValueTransformer {
  to(value: boolean | null): number | null {
    if (value === null) {
      return null;
    }
    return value ? 1 : 0;
  }

  from(value: number | null): boolean | null {
    if (value === null) {
      return null;
    }
    return value === 1;
  }
}

export class IntTransformer implements ValueTransformer {
  to(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return parseInt(value, 10);
    }

    if (typeof value === 'number') {
      return value;
    }

    return null;
  }

  from(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return Number(value);
    }

    if (typeof value === 'number') {
      return value;
    }

    return null;
  }
}

/**
 * Base entity class providing common fields and functionality for all entities
 */
export abstract class CrudEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({
    type: 'timestamp',
    transformer: new DateTransformer(),
    comment: 'Record creation timestamp',
  })
  @IsOptional()
  createdAt?: number;

  @UpdateDateColumn({
    type: 'timestamp',
    transformer: new DateTransformer(),
    comment: 'Record last update timestamp',
  })
  @IsOptional()
  updatedAt?: number;

  @DeleteDateColumn({
    type: 'timestamp',
    transformer: new DateTransformer(true),
    comment: 'Record deletion timestamp (soft delete)',
  })
  @IsOptional()
  deletedAt?: number | null;
}
