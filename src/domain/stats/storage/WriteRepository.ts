import { StatRecord } from '../StatRecord'

export interface WriteRepository {
  incrementStatRecord: (statRecord: StatRecord, incrementBy?: number) => Promise<number>
  incrementProviderStatRecord: (statRecord: StatRecord, incrementBy?: number) => Promise<number>
  incrementErrorRecord: (statRecord: StatRecord, incrementBy?: number) => Promise<number>
}
