import { Injectable, BadRequestException, type PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidateIdPipe implements PipeTransform<string | number, number> {
  transform(value: string | number): number {
    const id = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive integer');
    }
    
    return id;
  }
}