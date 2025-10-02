import { Inject, Injectable } from '@nestjs/common';
import { BaseService, getBaseServiceInjectToken } from 'nestjs-blueprint-crud';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(getBaseServiceInjectToken(User))
    private readonly baseService: BaseService<User>,
  ) {}

  /**
   * Find all active users
   */
  async findActiveUsers(): Promise<User[]> {
    return this.baseService.find({
      where: { status: 'active' },
    });
  }

  /**
   * Find users by age range
   */
  async findUsersByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return this.baseService.find({
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
    return this.baseService.find({
      where: {
        or: [{ name: { contains: keyword } }, { email: { contains: keyword } }],
      },
    });
  }

  /**
   * Promote user status
   */
  async promoteUser(userId: number, newStatus: string): Promise<User> {
    return this.baseService.update(userId, { status: newStatus });
  }

  /**
   * Batch update user status
   */
  async batchUpdateStatus(userIds: number[], status: string): Promise<void> {
    await this.baseService.bulkUpdate(userIds, { status });
  }

  /**
   * Get statistics of users by different statuses
   */
  async getUserStatistics(): Promise<Record<string, number>> {
    const [active, inactive, suspended] = await Promise.all([
      this.baseService.count({ where: { status: 'active' } }),
      this.baseService.count({ where: { status: 'inactive' } }),
      this.baseService.count({ where: { status: 'suspended' } }),
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
    return this.baseService.find({
      populate: ['orders'],
      where: {
        orders: { '!': null },
      },
    });
  }
}
