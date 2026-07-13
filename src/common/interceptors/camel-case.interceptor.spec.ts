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

  it('should not transform query params (handled by QueryCamelCasePipe)', () => {
    const mockRequest = {
      body: {},
      query: {
        herd_book_id: '1',
        page_size: '20',
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

    // Query params should remain unchanged - transformation is handled by QueryCamelCasePipe
    expect(mockRequest.query).toEqual({
      herd_book_id: '1',
      page_size: '20',
    });
  });
});
