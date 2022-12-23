import { Timestamp } from './Timestamp'
export type Granularity = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
export interface IKeyService {
  createKey: (recordOpts: { type: 'request' | 'error', entryPoint: string, profile?: string, provider?: string }, timestamp: Timestamp, granularity: Granularity) => string
}
