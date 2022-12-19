import config, { IConfig } from 'config'
import { WbengRequest } from './dto/WbengRequest'
import { createKeyService } from './service/createKey'
import { createWriteRepository } from './service/createWriteRepository'
import { updateAPIStats, updateProviderStats } from './service/updateStats'

const statsConfig: IConfig = config.get('stats')

const writeRepository = createWriteRepository(statsConfig.get('storage'))
const keyService = createKeyService({ keyDelimiter: statsConfig.get('keyDelimiter') })

export async function updateHits (request: WbengRequest): Promise<number> {
  return await updateAPIStats(request, writeRepository, keyService)
}

export async function updateProviderHits (request: WbengRequest): Promise<number> {
  return await updateProviderStats(request, writeRepository, keyService)
}
