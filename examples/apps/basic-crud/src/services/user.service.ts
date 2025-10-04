import { Inject, Injectable } from '@nestjs/common';
import { CrudService, getCrudServiceInjectToken } from 'nestjs-blueprint-crud';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(getCrudServiceInjectToken(User))
    private readonly crudService: CrudService<User>,
  ) {}

  /**
   * Find all active users
   */
  async findActiveUsers(): Promise<User[]> {
    return this.crudService.find({
      where: { status: 'active' },
    });
  }

  /**
   * Find users by age range
   */
  async findUsersByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return this.crudService.find({
      where: {
        age: {
          '>=': minAge,
          '<=': maxAge,
        },
      },
    });
  }

  /**
   * Find users containing specific keywords
   */
  async searchUsers(keyword: string): Promise<User[]> {
    return this.crudService.find({
      where: {
        or: [{ name: { contains: keyword } }, { email: { contains: keyword } }],
      },
    });
  }

  /**
   * Promote user status
   */
  async promoteUser(userId: number, newStatus: string): Promise<User> {
    return this.crudService.update(userId, { status: newStatus });
  }

  /**
   * Batch update user status
   */
  async batchUpdateStatus(userIds: number[], status: string): Promise<void> {
    await this.crudService.bulkUpdate(userIds, { status });
  }

  /**
   * Get statistics of users by different statuses
   */
  async getUserStatistics(): Promise<Record<string, number>> {
    const [active, inactive, suspended] = await Promise.all([
      this.crudService.count({ where: { status: 'active' } }),
      this.crudService.count({ where: { status: 'inactive' } }),
      this.crudService.count({ where: { status: 'suspended' } }),
    ]);

    return {
      active,
      inactive,
      suspended,
      total: active + inactive + suspended,
    };
  }

  /**
   * Find users with orders
   */
  async findUsersWithOrders(): Promise<User[]> {
    return this.crudService.find({
      populate: ['orders'],
      where: {
        orders: { '!': null },
      },
    });
  }
}
