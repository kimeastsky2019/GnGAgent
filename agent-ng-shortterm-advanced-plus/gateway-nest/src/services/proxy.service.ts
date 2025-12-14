import { Injectable, CacheInterceptor, UseInterceptors, CacheTTL, CacheKey } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import objectHash from 'object-hash';

@Injectable()
export class ProxyService {
  constructor(private readonly http: HttpService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  async health(url: string) {
    const r = await firstValueFrom(this.http.get(url));
    return r.data;
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(20)
  async cachedPost(url: string, body: any) {
    // body-based cache key via object-hash (Nest uses method+args by default; this reinforces uniqueness)
    (cachedPost as any).cacheKey = `post:${url}:${objectHash(body)}`;
    const r = await firstValueFrom(this.http.post(url, body));
    return r.data;
  }

  async post(url: string, body: any) {
    const r = await firstValueFrom(this.http.post(url, body));
    return r.data;
  }
}
