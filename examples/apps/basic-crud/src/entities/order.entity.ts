import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import {
  BaseEntity,
  CreateProperty,
  UpdateProperty,
  QueryProperty,
  SerializeProperty,
} from 'nestjs-blueprint-crud';
import { User } from './user.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column()
  @CreateProperty({
    description: 'Order number',
    example: 'ORD-001',
  })
  @UpdateProperty({
    description: 'Order number',
    example: 'ORD-001',
  })
  @QueryProperty({
    description: 'Order number',
    example: 'ORD',
  })
  @SerializeProperty({
    description: 'Order number',
  })
  orderNumber!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @CreateProperty({
    description: 'Order total amount',
    type: 'number',
    example: 99.99,
  })
  @UpdateProperty({
    description: 'Order total amount',
    type: 'number',
    example: 149.99,
  })
  @QueryProperty({
    description: 'Order total amount',
    example: 100,
  })
  @SerializeProperty({
    description: 'Order total amount',
  })
  totalAmount!: number;

  @Column({ default: 'pending' })
  @CreateProperty({
    description: 'Order status',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    example: 'pending',
  })
  @UpdateProperty({
    description: 'Order status',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    example: 'processing',
  })
  @QueryProperty({
    description: 'Order status',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  })
  @SerializeProperty({
    description: 'Current order status',
  })
  status!: string;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  @CreateProperty({
    description: 'Order owner user ID',
  })
  @UpdateProperty({
    description: 'Order owner user ID',
  })
  @QueryProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Order owner user',
  })
  @SerializeProperty({
    isEntity: true,
    entityName: 'User',
    description: 'Order owner user',
  })
  user!: User;

  @Column()
  @CreateProperty({
    description: 'Order owner user ID',
    type: 'number',
    example: 1,
  })
  @UpdateProperty({
    description: 'Order owner user ID',
    type: 'number',
    example: 1,
  })
  @QueryProperty({
    description: 'Order owner user ID',
    type: 'number',
  })
  @SerializeProperty({
    description: 'Order owner user ID',
  })
  userId!: number;
}
