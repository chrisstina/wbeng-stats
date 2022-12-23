import { KeyServiceConfig } from '../infrastructure/config/KeyServiceConfig'
import { Granularity, IKeyService } from '../domain/stats/IKeyService'
import { Timestamp } from '../domain/stats/Timestamp'

export function createKeyService (config: KeyServiceConfig): IKeyService {
  return {
    createKey (recordOpts: { type: 'request' | 'error', entryPoint: string, profile?: string, provider?: string }, timestamp: Timestamp, granularity: Granularity = 'minute'): string {
      const timestampPart = createTimestampPart(timestamp, granularity)
      return [
        recordOpts.type,
        recordOpts.entryPoint,
        (recordOpts.profile !== undefined) ? recordOpts.profile : '*',
        (recordOpts.provider !== undefined) ? recordOpts.provider : '*',
        ...timestampPart
      ]
        .filter(keyPart => keyPart !== '')
        .join(config.keyDelimiter)
    }
  }
}

function createTimestampPart (timestamp: Timestamp, granulatiry: Granularity = 'minute'): string[] {
  const {
    year,
    month,
    week,
    day,
    hour
  } = timestamp
  switch (granulatiry) {
    case 'hour':
      return [year, month, week, day, hour]
    case 'day':
      return [year, month, week, day]
    case 'week':
      return [year, month, week]
    case 'month':
      return [year, month]
    case 'year':
      return [year]
    default:
      return Object.values(timestamp)
  }
}
