import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerModule } from 'nestjs-blueprint-crud';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CrudControllerModule.forEntity({
      entity: User,
      prefix: 'users',
      tagName: 'Users',
      permissions: {
        list: true,
        count: true,
        get: true,
        create: true,
        update: true,
        delete: true,
      },
    }),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
