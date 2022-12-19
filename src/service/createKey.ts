import { CreateWbengAPIHitRecord } from '../dto/CreateWbengAPIHitRecord'
import { IKeyService } from '../domain/stats/IKeyService'
import { Timestamp } from '../domain/stats/Timestamp'
import { KeyServiceConfig } from '../infrastructure/config/KeyServiceConfig'
import { CreateWbengAPIErrorRecord, instanceOfAPIErrorRecord } from '../dto/CreateWbengAPIErrorRecord'

export function createKeyService (config: KeyServiceConfig): IKeyService {
  return {
    createKey (request: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord, timestamp: Timestamp): string {
      let statType = 'request'
      if (instanceOfAPIErrorRecord(request)) {
        statType = 'error'
      }
      return [
        statType,
        request.entryPoint,
        request.profile,
        (request.provider != null) ? request.provider : '',
        request.server,
        ...Object.values(timestamp)]
        .filter(keyPart => keyPart !== '')
        .join(config.keyDelimiter)
    }
  }
}
