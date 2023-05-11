import { CreateWbengAPIHitRecord } from "../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "../dto/CreateWbengAPIErrorRecord";
import { CreateProviderAPIHitRecord } from "../dto/CreateProviderAPIHitRecord";
import { requestToTimestampedStatRecord } from "../domain/stats/mappers/requestToStat";
import { IKeyService } from "../domain/stats/IKeyService";
import { WriteRepository } from "../domain/stats/storage/WriteRepository";

export async function updateAPIStats(
  request: CreateWbengAPIHitRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementStatRecord(statRecord);
}

export async function updateProviderStats(
  request: CreateProviderAPIHitRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementProviderStatRecord(statRecord);
}

export async function updateErrorStats(
  request: CreateWbengAPIErrorRecord,
  writeRepository: WriteRepository,
  keyService: IKeyService
): Promise<number> {
  // @todo validation
  const statRecord = requestToTimestampedStatRecord(request, keyService);
  return await writeRepository.incrementErrorRecord(statRecord);
}
