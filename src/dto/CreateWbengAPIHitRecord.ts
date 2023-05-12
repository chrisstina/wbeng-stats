export interface CreateWbengAPIHitRecord {
  entryPoint: string;
  profile?: string;
  provider?: string;
  additionalData: {};
}

export function instanceOfWbengAPIHitRecord (
  object: any
): object is CreateWbengAPIHitRecord {
  return "entryPoint" in object;
}
