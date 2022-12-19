import { WbengRequest } from '../../../dto/WbengRequest'
import { dateToTimestamp } from './dateToTimestamp'
import { IKeyService } from '../IKeyService'
import { StatRecord } from '../StatRecord'

export function requestToTimestampedStatRecord (request: WbengRequest, keyService: IKeyService): StatRecord {
  const timestamp = dateToTimestamp(new Date())
  const key = keyService.createKey(request, timestamp)
  return { key, ...request, timestamp }
}