import { WbengRequest } from '../dto/WbengRequest'
import { IKeyService } from '../domain/stats/IKeyService'
import { Timestamp } from '../domain/stats/Timestamp'
import { KeyServiceConfig } from '../infrastructure/config/KeyServiceConfig'

export function createKeyService (config: KeyServiceConfig): IKeyService {
  return {
    createKey (request: WbengRequest, timestamp: Timestamp): string {
      return [request.entryPoint,
        request.profile,
        (request.provider != null) ? request.provider : '',
        request.server,
        ...Object.values(timestamp)]
        .filter(keyPart => keyPart !== '')
        .join(config.keyDelimiter)
    }
  }
}
