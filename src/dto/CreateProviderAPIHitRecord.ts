export interface CreateProviderAPIHitRecord {
  entryPoint: string;
  profile?: string;
  provider?: string;
  additionalData: {
    providerOperationName: string;
  };
}
