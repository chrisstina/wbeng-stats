import { CreateWbengAPIHitRecord } from "../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "../dto/CreateWbengAPIErrorRecord";
import { requestToTimestampedStatRecord } from "../domain/stats/mappers/requestToStat";
import { IKeyService } from "../domain/stats/IKeyService";
import { WriteRepository } from "../domain/stats/storage/WriteRepository";
import { CreateExternalAPICallRecord } from "../dto/CreateExternalAPICallRecord";

export async function updateAPIStats (
  request: CreateWbengAPIHitRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementWbengAPIHitCounter(statRecord);
}

export async function updateProviderStats (
  request: CreateWbengAPIHitRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementWbengProviderHitCounter(statRecord);
}

export async function updateExternalAPIUsageStats (
  request: CreateExternalAPICallRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementExternalApiCallCounter(statRecord);
}

export async function updateErrorStats (
  request: CreateWbengAPIErrorRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementWbengAPIErrorCounter(statRecord);
}
