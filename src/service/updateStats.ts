import { WbengRequest } from '../dto/WbengRequest'
import { requestToTimestampedStatRecord } from '../domain/stats/mappers/requestToStat'
import { IKeyService } from '../domain/stats/IKeyService'
import { WriteRepository } from '../domain/stats/storage/WriteRepository'

export async function updateAPIStats (request: WbengRequest, writeRepository: WriteRepository, keyService: IKeyService): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService)
  return await writeRepository.incrementStatRecord(statRecord)
}

export async function updateProviderStats (request: WbengRequest, writeRepository: WriteRepository, keyService: IKeyService): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService)
  return await writeRepository.incrementProviderStatRecord(statRecord)
}
