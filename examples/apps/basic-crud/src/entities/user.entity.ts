import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import {
  CrudEntity,
  CreateProperty,
  UpdateProperty,
  QueryProperty,
  SerializeProperty,
  CrudProperty, // New unified decorator
} from 'nestjs-blueprint-crud';
import { Type } from 'class-transformer';
import { Order } from './order.entity';
import { Organization } from './organization.entity';

@Entity('users')
export class User extends CrudEntity {
  @Column()
  @CrudProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name!: string;

  // Legacy approach (still supported):
  // @Column()
  // @CreateProperty({
  //   description: 'User name',
  //   example: 'John Doe',
  // })
  // @UpdateProperty({
  //   description: 'User name',
  //   example: 'John Doe',
  // })
  // @QueryProperty({
  //   description: 'User name',
  //   example: 'John',
  // })
  // @SerializeProperty({
  //   description: 'User name',
  // })
  // name!: string;

  @Column({ unique: true })
  @CrudProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  email!: string;

  @Column({ nullable: true })
  @CreateProperty({
    description: 'Age',
    required: false,
    type: 'number',
    example: 25,
  })
  @UpdateProperty({
    description: 'Age',
    required: false,
    type: 'number',
    example: 26,
  })
  @QueryProperty({
    description: 'Age',
    example: 25,
  })
  @SerializeProperty({
    description: 'User age',
  })
  age?: number;

  @Column({ default: 'active' })
  @CreateProperty({
    description: 'User status',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
  })
  @UpdateProperty({
    description: 'User status',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
  })
  @QueryProperty({
    description: 'User status',
    enum: ['active', 'inactive', 'suspended'],
  })
  @SerializeProperty({
    description: 'Current user status',
  })
  status!: string;

  @Column({ nullable: true })
  @CrudProperty({ description: 'Organization ID', serialize: false })
  organizationId?: number;

  @ManyToOne(() => Organization, (org) => org.users)
  @CrudProperty({ isEntity: true, entityName: 'Organization' })
  @Type(() => Organization)
  organization?: Organization;

  @OneToMany(() => Order, order => order.user)
  @SerializeProperty({
    isEntity: true,
    entityName: 'Order',
    description: 'All orders of the user',
  })
  orders!: Order[];
}
