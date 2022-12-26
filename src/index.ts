import config, { IConfig } from 'config'
import { CreateWbengAPIHitRecord } from './dto/CreateWbengAPIHitRecord'
import { CreateWbengAPIErrorRecord } from './dto/CreateWbengAPIErrorRecord'
import { createKeyService } from './service/createKey'
import { createWriteRepository } from './service/createWriteRepository'
import { updateAPIStats, updateErrorStats, updateProviderStats } from './service/updateStats'
import { Timestamp } from './domain/stats/Timestamp'
import { Granularity } from './domain/stats/IKeyService'

const statsConfig: IConfig = config.get('stats')

const writeRepository = createWriteRepository(statsConfig.get('storage'))
const keyService = createKeyService({ keyDelimiter: statsConfig.get('keyDelimiter') })

export async function updateHits (request: CreateWbengAPIHitRecord): Promise<number> {
  return await updateAPIStats(request, writeRepository, keyService)
}

export async function updateProviderHits (request: CreateWbengAPIHitRecord): Promise<number> {
  return await updateProviderStats(request, writeRepository, keyService)
}

export async function updateErrors (request: CreateWbengAPIErrorRecord): Promise<number> {
  return await updateErrorStats(request, writeRepository, keyService)
}

export function createKey (recordOpts: { type: 'request' | 'error', entryPoint: string, profile?: string, provider?: string }, timestamp: Timestamp, granularity?: Granularity): string {
  return keyService.createKey(recordOpts, timestamp, granularity)
}
