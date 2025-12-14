import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Field, Float, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
class Health {
  @Field() service: string;
  @Field() status: string;
  @Field() ts: string;
}

@InputType()
class ForecastInput {
  @Field() siteId: string;
  @Field() horizon: string;
  @Field() granularityMin: number;
}

@ObjectType()
class TimePoint {
  @Field() t: string;
  @Field(() => Float) y: number;
}

@Resolver()
export class RootResolver {
  constructor(private readonly http: HttpService) {}

  @Query(() => Health)
  async health(): Promise<Health> {
    return { service: 'gateway-nest-adv', status: 'ok', ts: new Date().toISOString() };
  }

  @Mutation(() => [TimePoint])
  async forecastLoad(@Args('input') input: ForecastInput): Promise<TimePoint[]> {
    const r = await firstValueFrom(this.http.post(`${process.env.FORECAST_URL}/forecast/load`, input));
    return r.data;
  }
}
