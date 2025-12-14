import { IsInt, IsString, Min, IsObject, IsOptional } from 'class-validator';

export class ForecastDto {
  @IsString() siteId: string;
  @IsString() horizon: string;
  @IsInt() @Min(1) granularityMin: number;
  @IsOptional() @IsObject() features?: Record<string, any>;
}
