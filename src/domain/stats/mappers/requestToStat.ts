import { dateToTimestamp } from "./dateToTimestamp";
import { IKeyService } from "../IKeyService";
import { StatRecord } from "../StatRecord";
import { CreateWbengAPIHitRecord } from "../../../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "../../../dto/CreateWbengAPIErrorRecord";
import { CreateExternalAPICallRecord } from "../../../dto/CreateExternalAPICallRecord";

/**
 * Used for aggregated stats
 * @param request
 * @param keyService
 */
export function requestToTimestampedStatRecord (
  request: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord | CreateExternalAPICallRecord,
  keyService: IKeyService
): StatRecord {
  const timestamp = dateToTimestamp(new Date());
  const key = keyService.createKey(
    request,
    timestamp,
    "minute"
  );
  return {
    key,
    ...request,
    timestamp
  };
}
