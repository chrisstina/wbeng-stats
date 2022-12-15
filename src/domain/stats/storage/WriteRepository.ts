import { StatRecord } from '../StatRecord'
import { ErrorStatRecord } from '../ErrorStatRecord'

export interface WriteRepository {
  incrementStatRecord: (statRecord: StatRecord, incrementBy?: number) => Promise<number>
  incrementErrorStatRecord: (errorStatRecord: ErrorStatRecord, incrementBy?: number) => Promise<number>
}
