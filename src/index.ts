import config, { IConfig } from "config";
import { CreateWbengAPIHitRecord } from "./dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "./dto/CreateWbengAPIErrorRecord";
import { createKeyService } from "./service/createKey";
import { createWriteRepository } from "./service/createWriteRepository";
import {
  updateAPIStats,
  updateErrorStats,
  updateExternalAPIUsageStats,
  updateProviderStats
} from "./service/updateStats";
import { CreateExternalAPICallRecord } from "./dto/CreateExternalAPICallRecord";

const statsConfig = config.get<IConfig>("stats");

const writeRepository = createWriteRepository(statsConfig.get("storage"));
const keyService = createKeyService({
  keyDelimiter: statsConfig.get("keyDelimiter")
});

export async function updateHits (
  request: CreateWbengAPIHitRecord
): Promise<number> {
  return await updateAPIStats(request, writeRepository, keyService);
}

export async function updateProviderHits (
  request: CreateWbengAPIHitRecord
): Promise<number> {
  return await updateProviderStats(request, writeRepository, keyService);
}

export async function updateErrors (
  request: CreateWbengAPIErrorRecord
): Promise<number> {
  return await updateErrorStats(request, writeRepository, keyService);
}

export async function updateExternalCalls (
  request: CreateExternalAPICallRecord
): Promise<number> {
  return await updateExternalAPIUsageStats(request, writeRepository, keyService);
}
