import 'reflect-metadata';
import { instanceToPlain } from 'class-transformer';
import { CrudEntity } from '../entities/base.entity';
import { CrudProperty } from './crud-property.decorator';
import { generateSwaggerRecordDtoForEntity } from './serialize-property.decorator';

// Create an entity with serialize: false
class TestEntity extends CrudEntity {
  name!: string;
  secret!: string;
}

// Apply CrudProperty decorators
CrudProperty({
  description: 'Name field',
  type: 'string',
})(TestEntity.prototype, 'name');

CrudProperty({
  description: 'Secret field - should NOT be serialized',
  type: 'string',
  serialize: false,  // This should exclude this property from response
})(TestEntity.prototype, 'secret');

// Generate the DTO
const RecordDto = generateSwaggerRecordDtoForEntity(TestEntity);

console.log('RecordDto class:', RecordDto?.name);

// Create an instance with both properties
const entity = { id: 1, name: 'test', secret: 'secret-value' };
const record = new RecordDto!(entity);

console.log('Record instance:', record);
console.log('instanceToPlain result:', instanceToPlain(record, { excludeExtraneousValues: true }));

// Now test what happens when we serialize the entity directly (this is what the controller does)
const rawEntity = new TestEntity();
Object.assign(rawEntity, entity);
console.log('\nRaw entity:', rawEntity);
console.log('instanceToPlain of raw entity:', instanceToPlain(rawEntity));
