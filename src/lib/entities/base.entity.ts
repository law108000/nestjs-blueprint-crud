import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { IsOptional } from 'class-validator';
import { SerializeProperty } from '../decorators/serialize-property.decorator';

/**
 * Base entity class providing common fields and functionality for all entities
 *
 * Provides id field and optional automatic timestamp fields (createdAt, updatedAt, deletedAt).
 * The timestamp fields can be customized or disabled by overriding them in extending classes.
 *
 * To customize timestamp field names:
 * ```typescript
 * @Entity()
 * export class MyEntity extends CrudEntity {
 *   @PrimaryGeneratedColumn()
 *   id!: number;
 *
 *   // Override with custom column names
 *   @CreateDateColumn({ name: 'created_at' })
 *   createdAt!: number;
 *
 *   @UpdateDateColumn({ name: 'updated_at' })
 *   updatedAt!: number;
 *
 *   @DeleteDateColumn({ name: 'deleted_at' })
 *   deletedAt?: number | null;
 * }
 * ```
 *
 * To disable timestamps entirely, override the properties without decorators:
 * ```typescript
 * @Entity()
 * export class MyEntity extends CrudEntity {
 *   @PrimaryGeneratedColumn()
 *   id!: number;
 *
 *   // Override without decorators to disable
 *   createdAt?: never;
 *   updatedAt?: never;
 *   deletedAt?: never;
 * }
 * ```
 */
export abstract class CrudEntity {
  @PrimaryGeneratedColumn()
  @SerializeProperty({
    description: 'Unique identifier',
    type: 'number',
  })
  id!: number;

  // Optional timestamp fields - can be overridden by extending classes
  @CreateDateColumn({
    comment: 'Record creation timestamp',
  })
  @IsOptional()
  @SerializeProperty({
    description: 'Record creation timestamp',
    type: 'number',
  })
  createdAt?: number;

  @UpdateDateColumn({
    comment: 'Record last update timestamp',
  })
  @IsOptional()
  @SerializeProperty({
    description: 'Record last update timestamp',
    type: 'number',
  })
  updatedAt?: number;

  @DeleteDateColumn({
    comment: 'Record deletion timestamp (soft delete)',
  })
  @IsOptional()
  @SerializeProperty({
    description: 'Record deletion timestamp (soft delete)',
    type: 'number',
  })
  deletedAt?: number | null;
}
