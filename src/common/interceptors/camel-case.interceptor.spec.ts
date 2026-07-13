import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CamelCaseInterceptor } from './camel-case.interceptor';

describe('CamelCaseInterceptor', () => {
  let interceptor: CamelCaseInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CamelCaseInterceptor],
    }).compile();

    interceptor = module.get<CamelCaseInterceptor>(CamelCaseInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform body keys to camelCase', () => {
    const mockRequest = {
      body: {
        herd_book_id: '123',
        page_size: '20',
      },
      query: {},
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockRequest.body).toEqual({
      herdBookId: '123',
      pageSize: '20',
    });
  });

  it('should transform query keys to camelCase via in-place mutation (Express v5 compatible)', () => {
    const mockRequest = {
      body: {},
      query: {
        herd_book_id: '1',
        page_size: '20',
        sort_field: 'name',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockRequest.query).toEqual({
      herdBookId: '1',
      pageSize: '20',
      sortField: 'name',
    });
  });

  it('should handle empty query object', () => {
    const mockRequest = {
      body: {},
      query: {},
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockRequest.query).toEqual({});
  });

  it('should handle null query', () => {
    const mockRequest = {
      body: {},
      query: null,
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockRequest.query).toBeNull();
  });

  it('should handle undefined query', () => {
    const mockRequest = {
      body: {},
      query: undefined,
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockRequest.query).toBeUndefined();
  });

  it('should handle mixed case keys in query', () => {
    const mockRequest = {
      body: {},
      query: {
        herd_book_id: '1',
        pageSize: '20', // already camelCase
        SORT_FIELD: 'name', // uppercase - toCamelCase only handles snake_case, not uppercase
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({}),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    // toCamelCase converts SORT_FIELD to SORTFIELD (removes underscore, doesn't lowercase)
    expect(mockRequest.query).toEqual({
      herdBookId: '1',
      pageSize: '20',
      SORTFIELD: 'name',
    });
  });
});
