import { IKeyService, Granularity } from "../../domain/stats/IKeyService";
import { Timestamp } from "../../domain/stats/Timestamp";
import { CreateWbengAPIHitRecord } from "../../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "../../dto/CreateWbengAPIErrorRecord";
import { CreateExternalAPICallRecord } from "../../dto/CreateExternalAPICallRecord";

type RecordOpts = CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord | CreateExternalAPICallRecord;

/**
 * Test double for IKeyService - generates deterministic keys for testing.
 */
export class MockKeyService implements IKeyService {
  private customKeys: Map<string, string> = new Map();

  createKey(
    recordOpts: RecordOpts,
    timestamp: Timestamp,
    granularity: Granularity = "minute"
  ): string {
    const keyId = recordOpts.entryPoint ?? (recordOpts as any).operationName ?? "";
    const customKey = this.customKeys.get(keyId);
    if (customKey) {
      return customKey;
    }

    // Default deterministic key generation
    const profile = recordOpts.profile;
    const entryPoint = recordOpts.entryPoint || "";
    const operationName = (recordOpts as any).operationName || "";
    const provider = recordOpts.provider || "";
    const { year, month, day, hour, minute } = timestamp;

    return `${profile}:${entryPoint}:${operationName}:${provider}:${year}-${month}-${day}:${hour}:${minute}:${granularity}`;
  }

  // Test utility to set custom keys
  setKey(forEntryPoint: string, key: string): void {
    this.customKeys.set(forEntryPoint, key);
  }

  reset(): void {
    this.customKeys.clear();
  }
}