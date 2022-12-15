import { StatType, WbengRequest } from '../dto/WbengRequest'
import { requestToErrorStatRecord, requestToTimestampedStatRecord } from '../domain/stats/mappers/requestToStat'
import { IKeyService } from '../domain/stats/IKeyService'
import { WriteRepository } from '../domain/stats/storage/WriteRepository'

export async function updateStats (request: WbengRequest, type: StatType, writeRepository: WriteRepository, keyService: IKeyService): Promise<number> {
  // @todo validation

  if (type === 'request') {
    const statRecord = requestToTimestampedStatRecord(request, keyService)
    return await writeRepository.incrementStatRecord(statRecord)
  }
  if (type === 'error') {
    const statRecord = requestToErrorStatRecord(request, keyService)
    return await writeRepository.incrementErrorStatRecord(statRecord)
  }
  throw new Error('Unknown request type. Expected request or error type.')
}
