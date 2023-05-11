import { knex, Knex } from "knex";
import { StorageConfig } from "../../config/StorageConfig";
import { StatRecord } from "../../../domain/stats/StatRecord";
import { WriteRepository } from "../../../domain/stats/storage/WriteRepository";

export class MysqlWriteRepository implements WriteRepository {
  private readonly hit_count_tablename = "hit_count";
  private readonly provider_hit_count_tablename = "provider_hit_count";
  private readonly error_count_tablename = "error_count";
  private readonly knexInstance: Knex;

  constructor(config: StorageConfig) {
    this.knexInstance = knex(config);
  }

  async incrementStatRecord(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    return await this.knexInstance
      .table(this.hit_count_tablename)
      .insert({
        recordKey: statRecord.key,
        entryPoint: statRecord.entryPoint,
        profile: statRecord.profile,
        ...statRecord.timestamp,
      })
      .onConflict("recordKey")
      .merge({
        total: this.knexInstance.raw(`?? + ${incrementBy}`, "total"),
      })
      .then((res: any) => {
        return res;
      })
      .catch(function (error: Error) {
        console.error(error.stack);
      });
  }

  async incrementProviderStatRecord(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    return await this.knexInstance
      .table(this.provider_hit_count_tablename)
      .insert({
        recordKey: statRecord.key,
        entryPoint: statRecord.entryPoint,
        provider: statRecord.provider,
        profile: statRecord.profile,
        ...statRecord.timestamp,
      })
      .onConflict("recordKey")
      .merge({
        total: this.knexInstance.raw(`?? + ${incrementBy}`, "total"),
      })
      .then((res: any) => {
        return res;
      })
      .catch(function (error: Error) {
        console.error(error.stack);
      });
  }

  async incrementErrorRecord(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    return await this.knexInstance
      .table(this.error_count_tablename)
      .insert({
        recordKey: statRecord.key,
        entryPoint: statRecord.entryPoint,
        provider: statRecord.provider,
        profile: statRecord.profile,
        ...statRecord.timestamp,
      })
      .onConflict("recordKey")
      .merge({
        total: this.knexInstance.raw(`?? + ${incrementBy}`, "total"),
      })
      .then((res: any) => {
        return res;
      })
      .catch(function (error: Error) {
        console.error(error.stack);
      });
  }
}
