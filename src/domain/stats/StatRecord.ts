import { Timestamp } from "./Timestamp";

/**
 * VO
 */
export class StatRecord {
  constructor(
    public key: string,
    public timestamp: Timestamp,
    public entryPoint?: string,
    public operationName?: string,
    public profile?: string,
    public provider?: string
  ) {}
}
