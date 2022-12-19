export interface CreateWbengAPIErrorRecord {
  entryPoint: string
  errors: string[]
  profile?: string
  provider?: string
  additionalData: {}
}

export function instanceOfAPIErrorRecord (object: any): object is CreateWbengAPIErrorRecord {
  return 'errors' in object
}
