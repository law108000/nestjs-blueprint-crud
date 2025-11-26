import request from 'supertest';
import type { ExampleTestContext } from '../../../tooling/test-helpers';
import {
  DEFAULT_TABLE_RESET_ORDER,
  bootstrapExampleApp,
  closeExampleApp,
  truncateTables,
} from '../../../tooling/test-helpers';
import { AppModule } from '../src/app.module';

type UserResponse = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  status: string;
  organizationId?: number | null;
  organization?: OrganizationResponse;
};

type OrganizationResponse = {
  id: number;
  name: string;
  description?: string | null;
};

describe('Basic CRUD example (e2e)', () => {
  let context: ExampleTestContext;

  const resetTables = () => truncateTables(context.dataSource, DEFAULT_TABLE_RESET_ORDER);

  beforeAll(async () => {
    context = await bootstrapExampleApp(AppModule);
    await resetTables();
  });

  afterEach(async () => {
    await resetTables();
  });

  afterAll(async () => {
    await resetTables();
    await closeExampleApp(context);
  });

  it('performs CRUD operations on users', async () => {
    const createResponse = await request(context.httpServer)
      .post('/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        age: 28,
        status: 'active',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      status: 'active',
    });

    const userId = createResponse.body.id;
    expect(userId).toBeDefined();

    const listResponse = await request(context.httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ status: 'active' }) })
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(userId);

    const countResponse = await request(context.httpServer)
      .get('/users/count')
      .query({ where: JSON.stringify({ status: 'active' }) })
      .expect(200);

    expect(countResponse.body.count).toBe(1);

    await request(context.httpServer)
      .patch(`/users/${userId}`)
      .send({ status: 'inactive' })
      .expect(200);

    const updatedResponse = await request(context.httpServer).get(`/users/${userId}`).expect(200);

    expect(updatedResponse.body.status).toBe('inactive');

    await request(context.httpServer).delete(`/users/${userId}`).expect(200);

    await request(context.httpServer).get(`/users/${userId}`).expect(404);
  });

  it('manages orders and associations for users', async () => {
    const createUser = await request(context.httpServer)
      .post('/users')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        age: 32,
        status: 'active',
      })
      .expect(201);

    const userId = createUser.body.id;

    const createOrder = await request(context.httpServer)
      .post('/orders')
      .send({
        orderNumber: 'ORD-001',
        totalAmount: 199.99,
        status: 'pending',
        userId,
      })
      .expect(201);

    const orderId = createOrder.body.id;
    expect(orderId).toBeDefined();

    await request(context.httpServer).put(`/users/${userId}/orders/${orderId}`).expect(200);

    const associationResponse = await request(context.httpServer)
      .get(`/users/${userId}/orders`)
      .expect(200);

    expect(associationResponse.body).toHaveLength(1);
    expect(associationResponse.body[0]).toMatchObject({
      id: orderId,
      orderNumber: 'ORD-001',
    });

    const countResponse = await request(context.httpServer)
      .get(`/users/${userId}/orders/count`)
      .expect(200);

    expect(countResponse.body.count).toBe(1);

    await request(context.httpServer).delete(`/users/${userId}/orders/${orderId}`).expect(200);

    const emptyResponse = await request(context.httpServer)
      .get(`/users/${userId}/orders`)
      .expect(200);

    expect(emptyResponse.body).toHaveLength(0);

    const orderRecord = await request(context.httpServer).get(`/orders/${orderId}`).expect(200);
    expect(orderRecord.body.userId).toBeNull();

    await request(context.httpServer).put(`/users/${userId}/orders`).send([orderId]).expect(200);

    const reattachedOrders = await request(context.httpServer)
      .get(`/users/${userId}/orders`)
      .expect(200);

    expect(reattachedOrders.body).toHaveLength(1);
    expect(reattachedOrders.body[0].id).toBe(orderId);
  });

  it('reassigns collections via replace blueprint semantics', async () => {
    const createUserOne = await request(context.httpServer)
      .post('/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
        status: 'active',
      })
      .expect(201);

    const createUserTwo = await request(context.httpServer)
      .post('/users')
      .send({
        name: 'Bruno',
        email: 'bruno@example.com',
        age: 34,
        status: 'active',
      })
      .expect(201);

    const userOneId = createUserOne.body.id;
    const userTwoId = createUserTwo.body.id;

    const orderOne = await request(context.httpServer)
      .post('/orders')
      .send({
        orderNumber: 'ORD-101',
        totalAmount: 59.99,
        status: 'processing',
        userId: userOneId,
      })
      .expect(201);

    const orderTwo = await request(context.httpServer)
      .post('/orders')
      .send({
        orderNumber: 'ORD-102',
        totalAmount: 21.45,
        status: 'pending',
        userId: userOneId,
      })
      .expect(201);

    const orderOneId = orderOne.body.id;
    const orderTwoId = orderTwo.body.id;

    await request(context.httpServer)
      .put(`/users/${userTwoId}/orders`)
      .send([orderOneId])
      .expect(200);

    const userTwoOrders = await request(context.httpServer)
      .get(`/users/${userTwoId}/orders`)
      .expect(200);

    expect(userTwoOrders.body).toHaveLength(1);
    expect(userTwoOrders.body[0].id).toBe(orderOneId);

    const userOneOrders = await request(context.httpServer)
      .get(`/users/${userOneId}/orders`)
      .expect(200);

    expect(userOneOrders.body).toHaveLength(1);
    expect(userOneOrders.body[0].id).toBe(orderTwoId);

    const reassignedOrder = await request(context.httpServer)
      .get(`/orders/${orderOneId}`)
      .expect(200);
    expect(reassignedOrder.body.userId).toBe(userTwoId);

    await request(context.httpServer).put(`/users/${userTwoId}/orders`).send([]).expect(200);

    const clearedOrders = await request(context.httpServer)
      .get(`/users/${userTwoId}/orders`)
      .expect(200);

    expect(clearedOrders.body).toHaveLength(0);

    const detachedOrder = await request(context.httpServer)
      .get(`/orders/${orderOneId}`)
      .expect(200);
    expect(detachedOrder.body.userId).toBeNull();
  });

  it('supports bulk workflows and soft deletes for users', async () => {
    const bulkCreateResponse = await request(context.httpServer)
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

    const bulkUpdateResponse = await request(context.httpServer)
      .patch('/users/bulk')
      .query({ ids: createdIds.join(',') })
      .send({ status: 'active' })
      .expect(200);

    const updatedUsers = bulkUpdateResponse.body as UserResponse[];
    expect(updatedUsers).toHaveLength(3);
    updatedUsers.forEach(user => {
      expect(user.status).toBe('active');
    });

    const bulkRemoveResponse = await request(context.httpServer)
      .delete('/users/bulk')
      .query({ ids: createdIds.join(',') })
      .expect(200);

    const removedUsers = bulkRemoveResponse.body as UserResponse[];
    expect(removedUsers).toHaveLength(3);

    const softDeletedIds: number[] = removedUsers.map(user => user.id);
    expect(softDeletedIds).toEqual(expect.arrayContaining(createdIds));

    const emptyListResponse = await request(context.httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ id: { in: createdIds } }) })
      .expect(200);

    expect(emptyListResponse.body).toHaveLength(0);

    const restoreResponse = await request(context.httpServer)
      .post(`/users/${createdIds[0]}/restore`)
      .expect(200);

    expect(restoreResponse.body).toMatchObject({ id: createdIds[0], name: 'Frank' });

    const restoredUserResponse = await request(context.httpServer)
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
      await request(context.httpServer).post('/users').send(user).expect(201);
    }

    const ageRangeResponse = await request(context.httpServer)
      .get('/users')
      .query({ where: JSON.stringify({ age: { '>=': 30, '<=': 40 } }) })
      .expect(200);

    expect(ageRangeResponse.body).toHaveLength(1);
    expect(ageRangeResponse.body[0].name).toBe('Eve');

    const searchResponse = await request(context.httpServer)
      .get('/users')
      .query({
        where: JSON.stringify({ or: [{ name: { contains: 'ar' } }, { name: { contains: 'av' } }] }),
      })
      .expect(200);

    const matchingUsers = searchResponse.body as UserResponse[];
    expect(matchingUsers).toHaveLength(2);

    const names = matchingUsers.map(item => item.name);
    expect(names).toEqual(expect.arrayContaining(['Carol', 'Dave']));
  });

  it('supports organization-user relationship with proper foreign key handling', async () => {
    // Create an organization
    const createOrgResponse = await request(context.httpServer)
      .post('/organizations')
      .send({
        name: 'Tech Corp',
        description: 'A technology company',
      })
      .expect(201);

    const orgId = createOrgResponse.body.id;
    expect(orgId).toBeDefined();
    expect(createOrgResponse.body).toMatchObject({
      name: 'Tech Corp',
      description: 'A technology company',
    });

    // Create a user with organizationId
    const createUserResponse = await request(context.httpServer)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@techcorp.com',
        age: 30,
        status: 'active',
        organizationId: orgId,
      })
      .expect(201);

    const userId = createUserResponse.body.id;
    expect(userId).toBeDefined();
    expect(createUserResponse.body).toMatchObject({
      name: 'John Doe',
      email: 'john@techcorp.com',
      organizationId: orgId,
    });

    // Get user and verify organization is populated (not overwritten by ID)
    const getUserResponse = await request(context.httpServer)
      .get(`/users/${userId}`)
      .query({ populate: 'organization' })
      .expect(200);

    expect(getUserResponse.body).toMatchObject({
      id: userId,
      name: 'John Doe',
      organizationId: orgId,
    });

    // Verify organization object is populated and not overwritten by its ID
    expect(getUserResponse.body.organization).toBeDefined();
    expect(getUserResponse.body.organization).toMatchObject({
      id: orgId,
      name: 'Tech Corp',
      description: 'A technology company',
    });
    expect(typeof getUserResponse.body.organization).toBe('object');
    expect(typeof getUserResponse.body.organization.id).toBe('number');

    // Update user's organization
    const anotherOrgResponse = await request(context.httpServer)
      .post('/organizations')
      .send({
        name: 'Another Corp',
      })
      .expect(201);

    const anotherOrgId = anotherOrgResponse.body.id;

    await request(context.httpServer)
      .patch(`/users/${userId}`)
      .send({ organizationId: anotherOrgId })
      .expect(200);

    const updatedUserResponse = await request(context.httpServer)
      .get(`/users/${userId}`)
      .query({ populate: 'organization' })
      .expect(200);

    expect(updatedUserResponse.body.organizationId).toBe(anotherOrgId);
    expect(updatedUserResponse.body.organization).toMatchObject({
      id: anotherOrgId,
      name: 'Another Corp',
    });
  });
});
