import { IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';

export class LogWaterDto {
  @IsInt()
  @Min(1, { message: 'Amount must be at least 1ml' })
  @Max(5000, { message: 'Amount cannot exceed 5000ml' })
  amount: number;

  @IsOptional()
  @IsIn(['water', 'coffee', 'tea', 'juice', 'other'])
  drinkType?: string;
}
