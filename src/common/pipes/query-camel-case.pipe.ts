import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { transformKeysToCamelCase } from '../utils/case-transform.util';

@Injectable()
export class QueryCamelCasePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'query' && value && typeof value === 'object') {
      return transformKeysToCamelCase(value);
    }
    return value;
  }
}
