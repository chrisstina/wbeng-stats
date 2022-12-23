import { dateToTimestamp } from './dateToTimestamp'
import { IKeyService } from '../IKeyService'
import { StatRecord } from '../StatRecord'
import { CreateWbengAPIHitRecord } from '../../../dto/CreateWbengAPIHitRecord'
import { CreateWbengAPIErrorRecord, instanceOfAPIErrorRecord } from '../../../dto/CreateWbengAPIErrorRecord'

export function requestToTimestampedStatRecord (request: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord, keyService: IKeyService): StatRecord {
  const timestamp = dateToTimestamp(new Date())
  let statType: 'request' | 'error' = 'request'
  if (instanceOfAPIErrorRecord(request)) {
    statType = 'error'
  }
  const key = keyService.createKey({ type: statType, ...request }, timestamp, 'minute')
  return { key, ...request, timestamp }
}
