import { Timestamp } from "./Timestamp";
import { CreateWbengAPIHitRecord } from "../../dto/CreateWbengAPIHitRecord";
import { CreateWbengAPIErrorRecord } from "../../dto/CreateWbengAPIErrorRecord";
import { CreateExternalAPICallRecord } from "../../dto/CreateExternalAPICallRecord";

export type Granularity = "minute" | "hour" | "day" | "week" | "month" | "year";

export interface IKeyService {
  createKey: (
    recordOpts: CreateWbengAPIHitRecord | CreateWbengAPIErrorRecord | CreateExternalAPICallRecord,
    timestamp: Timestamp,
    granularity?: Granularity
  ) => string;
}
