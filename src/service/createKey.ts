import { Granularity, IKeyService } from "../domain/stats/IKeyService";
import { Timestamp } from "../domain/stats/Timestamp";
import { CreateExternalAPICallRecord, instanceOfExternalAPICallRecord } from "../dto/CreateExternalAPICallRecord";
import { CreateWbengAPIHitRecord, instanceOfWbengAPIHitRecord } from "../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord, instanceOfAPIErrorRecord } from "../dto/CreateWbengAPIErrorRecord";
import { KeyServiceConfig } from "../infrastructure/config/KeyServiceConfig";

function createTimestampPart (
  timestamp: Timestamp,
  granularity?: Granularity
): string[] {
  const {
    year,
    month,
    week,
    day,
    hour
  } = timestamp;

  if (granularity !== undefined) {
    switch (granularity) {
      case "hour":
        return [year, month, week, day, hour];
      case "day":
        return [year, month, week, day];
      case "week":
        return [year, month, week];
      case "month":
        return [year, month];
      case "year":
        return [year];
      default:
        return Object.values(timestamp);
    }
  }

  const key: string[] = [];
  [year, month, week, day, hour].forEach((part) => {
    if (part === undefined || part === "") {
      return key;
    }
    key.push(part);
  });
  return key;
}

function normalizeOperationName (name: string): string {
  return name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
}

export function createKeyService (config: KeyServiceConfig): IKeyService {
  return {
    createKey (
      recordOpts: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord | CreateExternalAPICallRecord,
      timestamp: Timestamp,
      granularity?: Granularity
    ): string {
      const keyParts = [];
      const timestampPart = createTimestampPart(timestamp, granularity);
      if (instanceOfExternalAPICallRecord(recordOpts)) {
        // @todo normalize operation name
        keyParts.push(
          normalizeOperationName(recordOpts.operationName),
          recordOpts.profile !== undefined ? recordOpts.profile : "*",
          recordOpts.provider);
      } else if (instanceOfWbengAPIHitRecord(recordOpts)) {
        let statType: "request" | "error" = "request";
        if (instanceOfAPIErrorRecord(recordOpts)) {
          statType = "error";
        }
        keyParts.push(
          statType,
          recordOpts.entryPoint,
          recordOpts.profile !== undefined ? recordOpts.profile : "*",
          recordOpts.provider !== undefined ? recordOpts.provider : "*");
      }
      return [
        ...keyParts,
        ...timestampPart
      ]
        .filter((keyPart) => keyPart !== "")
        .join(config.keyDelimiter);
    }
  };
}
