import { NextRequest } from 'next/server';
import { proxy, config as proxyConfig } from './proxy';

export async function middleware(req: NextRequest) {
  return await proxy(req);
}

export const config = proxyConfig;
