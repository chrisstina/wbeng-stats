import { StatRecord } from "../../domain/stats/StatRecord";
import { WriteRepository } from "../../domain/stats/storage/WriteRepository";

/**
 * Test double for WriteRepository - stubs database interactions
 * without making actual database calls.
 */
export class MockWriteRepository implements WriteRepository {
  private hits: Map<string, number> = new Map();
  private providerHits: Map<string, number> = new Map();
  private errors: Map<string, number> = new Map();
  private externalCalls: Map<string, number> = new Map();

  async incrementWbengAPIHitCounter(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    const key = statRecord.key;
    const current = this.hits.get(key) || 0;
    this.hits.set(key, current + incrementBy);
    return this.hits.get(key)!;
  }

  async incrementWbengProviderHitCounter(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    const key = statRecord.key;
    const current = this.providerHits.get(key) || 0;
    this.providerHits.set(key, current + incrementBy);
    return this.providerHits.get(key)!;
  }

  async incrementWbengAPIErrorCounter(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    const key = statRecord.key;
    const current = this.errors.get(key) || 0;
    this.errors.set(key, current + incrementBy);
    return this.errors.get(key)!;
  }

  async incrementExternalApiCallCounter(
    statRecord: StatRecord,
    incrementBy = 1
  ): Promise<number> {
    const key = statRecord.key;
    const current = this.externalCalls.get(key) || 0;
    this.externalCalls.set(key, current + incrementBy);
    return this.externalCalls.get(key)!;
  }

  // Test utilities
  getHitCount(key: string): number {
    return this.hits.get(key) || 0;
  }

  getProviderHitCount(key: string): number {
    return this.providerHits.get(key) || 0;
  }

  getErrorCount(key: string): number {
    return this.errors.get(key) || 0;
  }

  getExternalCallCount(key: string): number {
    return this.externalCalls.get(key) || 0;
  }

  reset(): void {
    this.hits.clear();
    this.providerHits.clear();
    this.errors.clear();
    this.externalCalls.clear();
  }
}