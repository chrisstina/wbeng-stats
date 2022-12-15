import { knex, Knex } from 'knex'
import { StorageConfig } from '../../config/StorageConfig'
import { StatRecord } from '../../../domain/stats/StatRecord'
import { WriteRepository } from '../../../domain/stats/storage/WriteRepository'
import { ErrorStatRecord } from '../../../domain/stats/ErrorStatRecord'

export class MysqlWriteRepository implements WriteRepository {
  private readonly hit_count_tablename = 'hits_count'
  private readonly error_count_tablename = 'hits_count'
  private readonly knexInstance: Knex

  constructor (config: StorageConfig) {
    this.knexInstance = knex(config)
  }

  async incrementStatRecord (statRecord: StatRecord, incrementBy = 1): Promise<number> {
    return await this.knexInstance.table(this.hit_count_tablename)
      .insert({
        record_key: statRecord.key,
        entryPoint: statRecord.entryPoint,
        server: statRecord.server,
        provider: statRecord.provider,
        profile: statRecord.profile,
        ...statRecord.timestamp
      })
      .onConflict('record_key')
      .merge({
        count: this.knexInstance.raw(`?? + ${incrementBy}`, 'count')
      })
      .then((res: any) => {
        return res
      })
      .catch(function (error: Error) {
        console.error(error.stack)
      })
  }

  async incrementErrorStatRecord (errorStatRecord: ErrorStatRecord, incrementBy = 1): Promise<number> {
    return await this.knexInstance.table(this.hit_count_tablename)
      .insert({
        record_key: errorStatRecord.key,
        entryPoint: errorStatRecord.entryPoint,
        server: errorStatRecord.server,
        provider: errorStatRecord.provider,
        profile: errorStatRecord.profile,
        ...errorStatRecord.timestamp
      })
      .onConflict('record_key')
      .merge({
        count: this.knexInstance.raw(`?? + ${incrementBy}`, 'count')
      })
      .then((res: any) => {
        return res
      })
      .catch(function (error: Error) {
        console.error(error.stack)
      })
  }
}
