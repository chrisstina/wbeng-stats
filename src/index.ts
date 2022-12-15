import config from 'config'
import { StatType, WbengRequest } from './dto/WbengRequest'
import { updateStats } from './service/updateStats'
import { createKeyService } from './service/createKey'
import { createWriteRepository } from './service/createWriteRepository'

const writeRepository = createWriteRepository(config.get('storage'))
const keyService = createKeyService({ keyDelimiter: config.get('keyDelimiter') })

export async function update (request: WbengRequest, type: StatType = 'request'): Promise<number> {
  return await updateStats(request, type, writeRepository, keyService)
}
