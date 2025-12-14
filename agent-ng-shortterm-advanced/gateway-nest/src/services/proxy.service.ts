import { Injectable, CacheInterceptor, UseInterceptors, CacheTTL } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  constructor(private readonly http: HttpService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(20)
  async health(url: string) {
    const r = await firstValueFrom(this.http.get(url));
    return r.data;
  }

  async post(url: string, body: any) {
    const r = await firstValueFrom(this.http.post(url, body));
    return r.data;
  }
}
