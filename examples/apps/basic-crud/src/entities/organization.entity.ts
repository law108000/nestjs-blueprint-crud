import { Entity, Column, OneToMany } from 'typeorm';
import { CrudEntity, CrudProperty } from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Entity('organizations')
export class Organization extends CrudEntity {
  @Column()
  @CrudProperty({
    description: 'Organization name',
    example: 'Acme Corp',
  })
  name!: string;

  @Column({ nullable: true })
  @CrudProperty({
    description: 'Organization description',
    example: 'A leading technology company',
    required: false,
  })
  description?: string;

  @OneToMany(() => User, (user) => user.organization)
  @CrudProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Users in the organization',
    serialize: true,
    create: false,
    update: false,
  })
  users!: User[];
}
