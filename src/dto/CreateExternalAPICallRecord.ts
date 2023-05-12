export interface CreateExternalAPICallRecord {
  provider: string;
  operationName: string;
  profile?: string;
  entryPoint?: string;
}
export function instanceOfExternalAPICallRecord(
  object: any
): object is CreateExternalAPICallRecord {
  return "operationName" in object;
}
