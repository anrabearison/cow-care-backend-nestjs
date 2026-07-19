import { RowErrorDto } from './row-error.dto';

export class DryRunResultDto {
  valid: boolean;
  totalRows: number;
  validRowsCount: number;
  errors: RowErrorDto[];
}

export { RowErrorDto } from './row-error.dto';
