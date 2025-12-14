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

@InputType()
class PlanOptimizeInput {
  @Field() siteId: string;
  @Field() horizon: string;
  @Field() granularityMin: number;
  @Field(() => String) forecasts: string;   // JSON as string for simplicity
  @Field(() => String) constraints: string; // JSON as string
}

@ObjectType()
class Setpoint {
  @Field() t: string;
  @Field(() => Float, { nullable: true }) essP?: number;
  @Field(() => Float, { nullable: true }) hvacSet?: number;
  @Field(() => Float, { nullable: true }) evKw?: number;
}

@ObjectType()
class PlanResponse {
  @Field() planId: string;
  @Field(() => String) objective: string; // JSON string
  @Field(() => [Setpoint]) setpoints: Setpoint[];
  @Field(() => [String]) explanations: string[];
}

@ObjectType()
class Nudge {
  @Field() nudgeId: string;
  @Field() title: string;
  @Field() message: string;
  @Field(() => Float) est_saving: number;
  @Field(() => Float) discomfort: number;
  @Field(() => String) rewards: string;
}

@InputType()
class NudgeInput {
  @Field({ nullable: true }) nudgeId?: string;
  @Field() title: string;
  @Field() message: string;
  @Field(() => Float) est_saving: number;
  @Field(() => Float) discomfort: number;
  @Field(() => String) rewards: string;
}

@Resolver()
export class RootResolver {
  constructor(private readonly http: HttpService) {}

  @Query(() => Health)
  async health(): Promise<Health> {
    return { service: 'gateway-nest-adv-plus', status: 'ok', ts: new Date().toISOString() };
  }

  @Mutation(() => [TimePoint])
  async forecastLoad(@Args('input') input: ForecastInput): Promise<TimePoint[]> {
    const r = await firstValueFrom(this.http.post(`${process.env.FORECAST_URL}/forecast/load`, input));
    return r.data;
  }

  @Mutation(() => PlanResponse)
  async planOptimize(@Args('input') input: PlanOptimizeInput): Promise<PlanResponse> {
    const body = {
      siteId: input.siteId,
      horizon: input.horizon,
      granularityMin: input.granularityMin,
      forecasts: JSON.parse(input.forecasts),
      constraints: JSON.parse(input.constraints)
    };
    const r = await firstValueFrom(this.http.post(`${process.env.EOP_URL}/plan/optimize`, body));
    const obj = r.data;
    return {
      planId: obj.planId,
      objective: JSON.stringify(obj.objective),
      setpoints: obj.setpoints,
      explanations: obj.explanations
    };
  }

  @Mutation(() => Nudge)
  async createNudge(@Args('input') input: NudgeInput): Promise<Nudge> {
    const body = {
      nudgeId: input.nudgeId,
      title: input.title,
      message: input.message,
      est_saving: input.est_saving,
      discomfort: input.discomfort,
      rewards: JSON.parse(input.rewards),
    };
    const r = await firstValueFrom(this.http.post(`${process.env.ENG_URL}/nudges`, body));
    const n = r.data;
    return {
      nudgeId: n.nudgeId, title: n.title, message: n.message,
      est_saving: n.est_saving, discomfort: n.discomfort, rewards: JSON.stringify(n.rewards)
    };
  }
}
