import { CreateWbengAPIHitRecord } from "./dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "./dto/CreateWbengAPIErrorRecord";
import { createKeyService } from "./service/createKey";
import { createWriteRepository } from "./service/createWriteRepository";
import {
  updateAPIStats,
  updateErrorStats,
  updateExternalAPIUsageStats,
  updateProviderStats,
} from "./service/updateStats";
import { CreateExternalAPICallRecord } from "./dto/CreateExternalAPICallRecord";

export interface StatsModuleConfig {
  storage: Parameters<typeof createWriteRepository>[0]; // или ваш точный тип конфига хранилища
  keyDelimiter: string;
}

// Интерфейс возвращаемого клиента
export interface StatsClient {
  updateHits(request: CreateWbengAPIHitRecord): Promise<number>;
  updateProviderHits(request: CreateWbengAPIHitRecord): Promise<number>;
  updateErrors(request: CreateWbengAPIErrorRecord): Promise<number>;
  updateExternalCalls(request: CreateExternalAPICallRecord): Promise<number>;
}

/**
 * Фабрика: принимает конфигурацию и возвращает готовый к работе клиент.
 */
export function createStatsClient(cfg: StatsModuleConfig): StatsClient {
  const writeRepository = createWriteRepository(cfg.storage);
  const keyService = createKeyService({ keyDelimiter: cfg.keyDelimiter });

  return {
    updateHits: (req) => updateAPIStats(req, writeRepository, keyService),
    updateProviderHits: (req) =>
      updateProviderStats(req, writeRepository, keyService),
    updateErrors: (req) => updateErrorStats(req, writeRepository, keyService),
    updateExternalCalls: (req) =>
      updateExternalAPIUsageStats(req, writeRepository, keyService),
  };
}
