import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../examples/app.module';

type UserResponse = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  status: string;
};

const truncateTables = async (dataSource: DataSource) => {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  await dataSource.query('TRUNCATE TABLE orders');
  await dataSource.query('TRUNCATE TABLE users');
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
};

describe('Examples E2E', () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer();
    dataSource = app.get(DataSource);

    await truncateTables(dataSource);
  });

  afterEach(async () => {
    await truncateTables(dataSource);
  });

  afterAll(async () => {
    await truncateTables(dataSource);
    await app.close();
  });

  it('performs CRUD operations on users', async () => {
    const createResponse = await request(httpServer)
      .post('/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        age: 28,
        status: 'active',
      })
      .expect(200);

    expect(createResponse.body).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      status: 'active',
    });
    const userId = createResponse.body.id;
    expect(userId).toBeDefined();

    const listResponse = await request(httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ status: 'active' }) })
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(userId);

    const countResponse = await request(httpServer)
      .get('/users/count')
      .query({ where: JSON.stringify({ status: 'active' }) })
      .expect(200);

    expect(countResponse.body.count).toBe(1);

    await request(httpServer)
      .patch(`/users/${userId}`)
      .send({ status: 'inactive' })
      .expect(200);

    const updatedResponse = await request(httpServer)
      .get(`/users/${userId}`)
      .expect(200);

    expect(updatedResponse.body.status).toBe('inactive');
  });

  it('manages orders and associations for users', async () => {
    const createUser = await request(httpServer)
      .post('/users')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        age: 32,
        status: 'active',
      })
      .expect(200);

    const userId = createUser.body.id;

    const createOrder = await request(httpServer)
      .post('/orders')
      .send({
        orderNumber: 'ORD-001',
        totalAmount: 199.99,
        status: 'pending',
        userId,
      })
      .expect(200);

    const orderId = createOrder.body.id;
    expect(orderId).toBeDefined();

    await request(httpServer)
      .put(`/users/${userId}/orders/${orderId}`)
      .expect(200);

    const associationResponse = await request(httpServer)
      .get(`/users/${userId}/orders`)
      .expect(200);

    expect(associationResponse.body).toHaveLength(1);
    expect(associationResponse.body[0]).toMatchObject({
      id: orderId,
      orderNumber: 'ORD-001',
    });

    const countResponse = await request(httpServer)
      .get(`/users/${userId}/orders/count`)
      .expect(200);

    expect(countResponse.body.count).toBe(1);

    await request(httpServer)
      .delete(`/users/${userId}/orders/${orderId}`)
      .expect(200);

    const emptyResponse = await request(httpServer)
      .get(`/users/${userId}/orders`)
      .expect(200);

    expect(emptyResponse.body).toHaveLength(0);
  });

  it('supports bulk workflows and soft deletes for users', async () => {
    const bulkCreateResponse = await request(httpServer)
      .post('/users/bulk')
      .send([
        {
          name: 'Frank',
          email: 'frank@example.com',
          age: 41,
          status: 'active',
        },
        {
          name: 'Grace',
          email: 'grace@example.com',
          age: 37,
          status: 'inactive',
        },
        {
          name: 'Heidi',
          email: 'heidi@example.com',
          age: 29,
          status: 'suspended',
        },
      ])
      .expect(200);

    const createdUsers = bulkCreateResponse.body as UserResponse[];
    expect(createdUsers).toHaveLength(3);
    const createdIds: number[] = createdUsers.map(user => user.id);
    expect(createdIds.every(id => typeof id === 'number')).toBe(true);

    const bulkUpdateResponse = await request(httpServer)
      .patch('/users/bulk')
      .query({ ids: createdIds.join(',') })
      .send({ status: 'active' })
      .expect(200);

    const updatedUsers = bulkUpdateResponse.body as UserResponse[];
    expect(updatedUsers).toHaveLength(3);
    updatedUsers.forEach(user => {
      expect(user.status).toBe('active');
    });

    const bulkRemoveResponse = await request(httpServer)
      .delete('/users/bulk')
      .query({ ids: createdIds.join(',') })
      .expect(200);

    const removedUsers = bulkRemoveResponse.body as UserResponse[];
    expect(removedUsers).toHaveLength(3);
    const softDeletedIds: number[] = removedUsers.map(user => user.id);
    expect(softDeletedIds).toEqual(expect.arrayContaining(createdIds));

    const emptyListResponse = await request(httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ id: { in: createdIds } }) })
      .expect(200);

    expect(emptyListResponse.body).toHaveLength(0);

    const restoreResponse = await request(httpServer)
      .post(`/users/${createdIds[0]}/restore`)
      .expect(200);

    expect(restoreResponse.body).toMatchObject({ id: createdIds[0], name: 'Frank' });

    const restoredUserResponse = await request(httpServer)
      .get(`/users/${createdIds[0]}`)
      .expect(200);

    expect(restoredUserResponse.body).toMatchObject({ id: createdIds[0], status: 'active' });
  });

  it('supports advanced query capabilities', async () => {
    const users = [
      { name: 'Carol', email: 'carol@example.com', age: 22, status: 'active' },
      { name: 'Dave', email: 'dave@example.com', age: 45, status: 'inactive' },
      { name: 'Eve', email: 'eve@example.com', age: 35, status: 'active' },
    ];

    for (const user of users) {
      await request(httpServer).post('/users').send(user).expect(200);
    }

    const ageRangeResponse = await request(httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ age: { '>=': 30, '<=': 40 } }) })
      .expect(200);

    expect(ageRangeResponse.body).toHaveLength(1);
    expect(ageRangeResponse.body[0].name).toBe('Eve');

    const searchResponse = await request(httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ or: [{ name: { contains: 'ar' } }] }) })
      .expect(200);

    const matchingUsers = searchResponse.body as UserResponse[];
    expect(matchingUsers).toHaveLength(2);
    const names = matchingUsers.map(item => item.name);
    expect(names).toEqual(expect.arrayContaining(['Carol', 'Dave']));
  });
});
