import { MockWriteRepository } from "./testDoubles/MockWriteRepository";
import { MockKeyService } from "./testDoubles/MockKeyService";
import { updateAPIStats, updateProviderStats, updateExternalAPIUsageStats, updateErrorStats } from "../service/updateStats";
import { CreateWbengAPIHitRecord } from "../dto/CreateWbengAPIHitRecord";
import { CreateExternalAPICallRecord } from "../dto/CreateExternalAPICallRecord";
import { CreateWbengAPIErrorRecord } from "../dto/CreateWbengAPIErrorRecord";

describe("StatsClient", () => {
  let writeRepository: MockWriteRepository;
  let keyService: MockKeyService;

  beforeEach(() => {
    writeRepository = new MockWriteRepository();
    keyService = new MockKeyService();
    // Set predictable keys for testing
    keyService.setKey("flights", "test-key:flights");
    keyService.setKey("api/Order/airshopping", "test-key:api");
  });

  describe("updateAPIStats", () => {
    it("should increment hit counter", async () => {
      const request: CreateWbengAPIHitRecord = {
        profile: "default",
        entryPoint: "flights",
        additionalData: {}
      };

      const result = await updateAPIStats(request, writeRepository, keyService);
      
      expect(result).toBe(1);
      expect(writeRepository.getHitCount("test-key:flights")).toBe(1);
    });
  });

  describe("updateProviderStats", () => {
    it("should increment provider hit counter", async () => {
      const request: CreateWbengAPIHitRecord = {
        profile: "default",
        entryPoint: "flights",
        additionalData: {},
        provider: "M2"
      };

      const result = await updateProviderStats(request, writeRepository, keyService);
      
      expect(result).toBe(1);
      expect(writeRepository.getProviderHitCount("test-key:flights")).toBe(1);
    });
  });

  describe("updateExternalAPIUsageStats", () => {
    it("should increment external API call counter", async () => {
      const request: CreateExternalAPICallRecord = {
        profile: "default",
        operationName: "api/Order/airshopping",
        provider: "M2"
      };

      const result = await updateExternalAPIUsageStats(request, writeRepository, keyService);
      
      expect(result).toBe(1);
    });
  });

  describe("updateErrorStats", () => {
    it("should increment error counter", async () => {
      const request: CreateWbengAPIErrorRecord = {
        profile: "default",
        entryPoint: "flights",
        errors: ["timeout"]
      };

      const result = await updateErrorStats(request, writeRepository, keyService);
      
      expect(result).toBe(1);
      expect(writeRepository.getErrorCount("test-key:flights")).toBe(1);
    });
  });
});