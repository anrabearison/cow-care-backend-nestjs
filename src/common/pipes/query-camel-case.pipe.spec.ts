import { QueryCamelCasePipe } from './query-camel-case.pipe';
import { ArgumentMetadata } from '@nestjs/common';

describe('QueryCamelCasePipe', () => {
  let pipe: QueryCamelCasePipe;

  beforeEach(() => {
    pipe = new QueryCamelCasePipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should transform query object keys from snake_case to camelCase', () => {
    const value = {
      herd_book_id: '1',
      page_size: '20',
      sort_field: 'name',
    };

    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toEqual({
      herdBookId: '1',
      pageSize: '20',
      sortField: 'name',
    });
  });

  it('should not transform if metadata.type is not query', () => {
    const value = {
      herd_book_id: '1',
      page_size: '20',
    };

    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toEqual({
      herd_book_id: '1',
      page_size: '20',
    });
  });

  it('should not transform if metadata.type is param', () => {
    const value = {
      herd_book_id: '1',
    };

    const metadata: ArgumentMetadata = {
      type: 'param',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toEqual({
      herd_book_id: '1',
    });
  });

  it('should return null if value is null', () => {
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(null, metadata);

    expect(result).toBeNull();
  });

  it('should return undefined if value is undefined', () => {
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(undefined, metadata);

    expect(result).toBeUndefined();
  });

  it('should return empty object if value is empty object', () => {
    const value = {};
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toEqual({});
  });

  it('should handle non-object values', () => {
    const value = 'string_value';
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: String,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toBe('string_value');
  });

  it('should handle number values', () => {
    const value = 123;
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Number,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toBe(123);
  });

  it('should handle mixed case keys (already camelCase)', () => {
    const value = {
      herdBookId: '1',
      pageSize: '20',
    };

    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Object,
      data: '',
    };

    const result = pipe.transform(value, metadata);

    expect(result).toEqual({
      herdBookId: '1',
      pageSize: '20',
    });
  });
});
