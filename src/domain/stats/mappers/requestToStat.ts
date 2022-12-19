import { CreateWbengAPIHitRecord } from '../../../dto/CreateWbengAPIHitRecord'
import { dateToTimestamp } from './dateToTimestamp'
import { IKeyService } from '../IKeyService'
import { StatRecord } from '../StatRecord'
import { CreateWbengAPIErrorRecord } from '../../../dto/CreateWbengAPIErrorRecord'

export function requestToTimestampedStatRecord (request: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord, keyService: IKeyService): StatRecord {
  const timestamp = dateToTimestamp(new Date())
  const key = keyService.createKey(request, timestamp)
  return { key, ...request, timestamp }
}
