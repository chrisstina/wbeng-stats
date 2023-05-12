import { StatRecord } from "../StatRecord";

export interface WriteRepository {
  incrementWbengAPIHitCounter: (
    statRecord: StatRecord,
    incrementBy?: number
  ) => Promise<number>;
  incrementWbengProviderHitCounter: (
    statRecord: StatRecord,
    incrementBy?: number
  ) => Promise<number>;
  incrementWbengAPIErrorCounter: (
    statRecord: StatRecord,
    incrementBy?: number
  ) => Promise<number>;
  incrementExternalApiCallCounter: (
    statRecord: StatRecord,
    incrementBy?: number
  ) => Promise<number>;
}
