import { Entity, Column, OneToMany } from 'typeorm';
import { CrudEntity, CrudProperty, SerializeProperty } from 'nestjs-blueprint-crud';
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
  @SerializeProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Users in the organization',
  })
  users!: User[];
}
