import { IsInt, IsString, Min, IsObject } from 'class-validator';

export class PlanOptimizeDto {
  @IsString() siteId: string;
  @IsString() horizon: string;
  @IsInt() @Min(1) granularityMin: number;
  @IsObject() forecasts: Record<string, any>;
  @IsObject() constraints: Record<string, any>;
}
