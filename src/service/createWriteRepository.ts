import { MysqlWriteRepository } from '../infrastructure/storage/mysql/MysqlWriteRepository'
import { StorageConfig } from '../infrastructure/config/StorageConfig'
import { WriteRepository } from '../domain/stats/storage/WriteRepository'

export function createWriteRepository (storageConfig: StorageConfig): WriteRepository {
  if (storageConfig.client === 'mysql') {
    return new MysqlWriteRepository(storageConfig)
  }
  throw new Error('Unsupported storage type')
}
