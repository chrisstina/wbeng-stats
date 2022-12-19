import { Timestamp } from './Timestamp'

/**
 * VO
 */
export class StatRecord {
  constructor (public key: string, public timestamp: Timestamp, public server: string, public entryPoint: string, public profile?: string, public provider?: string) {
  }
}
