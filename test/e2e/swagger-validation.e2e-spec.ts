import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../examples/apps/basic-crud/src/app.module';
import * as fs from 'fs';

describe('Swagger Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not generate empty $ref values in Swagger schema', () => {
    const config = new DocumentBuilder()
      .setTitle('Example API')
      .setVersion('1.0')
      .setDescription('Test Swagger Generation')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Save the document to a file for inspection
    try {
      fs.writeFileSync('/tmp/swagger-example.json', JSON.stringify(document, null, 2));
    } catch {
      // Ignore file write errors
    }

    // Check for empty $ref values
    const documentStr = JSON.stringify(document);
    const emptyRefPattern = /"(\$ref)":\s*"#\/components\/schemas\/"/;
    const hasEmptyRefs = emptyRefPattern.test(documentStr);

    expect(hasEmptyRefs).toBe(false);

    // Verify schemas are properly defined
    expect(document.components?.schemas).toBeDefined();
    expect(document.components?.schemas?.['UserRecordDto']).toBeDefined();
    expect(document.components?.schemas?.['OrderRecordDto']).toBeDefined();

    // Check that User entity has proper relationship references
    const userSchema = document.components?.schemas?.['UserRecordDto'];
    expect(userSchema).toBeDefined();
    if (userSchema && 'properties' in userSchema) {
      expect(userSchema.properties).toBeDefined();
    }

    // Check that Order entity has proper relationship references
    const orderSchema = document.components?.schemas?.['OrderRecordDto'];
    expect(orderSchema).toBeDefined();
    if (orderSchema && 'properties' in orderSchema) {
      expect(orderSchema.properties).toBeDefined();
    }

    // Verify the orders property in UserRecordDto has a valid $ref
    if (userSchema && 'properties' in userSchema && userSchema.properties?.['orders']) {
      const ordersProperty = userSchema.properties['orders'];
      const ordersRef = JSON.stringify(ordersProperty);
      expect(ordersRef).not.toContain('"#/components/schemas/"');
      expect(ordersRef).toContain('OrderRecordDto');
    }

    // Verify the user property in OrderRecordDto has a valid $ref
    if (orderSchema && 'properties' in orderSchema && orderSchema.properties?.['user']) {
      const userProperty = orderSchema.properties['user'];
      const userRef = JSON.stringify(userProperty);
      expect(userRef).not.toContain('"#/components/schemas/"');
      expect(userRef).toContain('UserRecordDto');
    }
  });

  it('should generate valid Swagger paths with entity references', () => {
    const config = new DocumentBuilder()
      .setTitle('Example API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Check that paths are properly defined
    expect(document.paths).toBeDefined();
    expect(document.paths['/users']).toBeDefined();
    expect(document.paths['/orders']).toBeDefined();

    // Check that the responses have proper schemas
    const usersGetResponse = document.paths['/users']?.get?.responses?.['200'];
    expect(usersGetResponse).toBeDefined();

    const ordersGetResponse = document.paths['/orders']?.get?.responses?.['200'];
    expect(ordersGetResponse).toBeDefined();

    // Verify no empty $ref in response schemas
    const responseStr = JSON.stringify({
      users: usersGetResponse,
      orders: ordersGetResponse,
    });
    expect(responseStr).not.toContain('"#/components/schemas/"');
  });
});
