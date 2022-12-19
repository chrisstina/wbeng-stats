import { CreateWbengAPIHitRecord } from '../../dto/CreateWbengAPIHitRecord'
import { CreateWbengAPIErrorRecord } from '../../dto/CreateWbengAPIErrorRecord'

import { Timestamp } from './Timestamp'

export interface IKeyService {
  createKey: (request: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord, timestamp: Timestamp) => string
}
