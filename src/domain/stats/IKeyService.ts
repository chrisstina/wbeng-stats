import { WbengRequest } from '../../dto/WbengRequest'
import { Timestamp } from './Timestamp'

export interface IKeyService {
  createKey: (request: WbengRequest, timestamp: Timestamp) => string
}
