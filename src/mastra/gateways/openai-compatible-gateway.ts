import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { GatewayLanguageModel } from "@mastra/core/llm";
import { MastraModelGateway, type ProviderConfig } from "@mastra/core/llm";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const OPENAI_COMPATIBLE_MODEL_ID = () =>
  `openai-compatible/openai-compatible/${requireEnv("OPENAI_COMPATIBLE_MODEL")}`;

export class OpenaiCompatibleGateway extends MastraModelGateway {
  readonly id = "openai-compatible";
  readonly name = "OpenAI Compatible";

  private get baseURL() {
    return requireEnv("OPENAI_COMPATIBLE_BASE_URL");
  }

  private get apiKey() {
    return requireEnv("OPENAI_COMPATIBLE_API_KEY");
  }

  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    return {
      "openai-compatible": {
        name: "OpenAI Compatible",
        models: [requireEnv("OPENAI_COMPATIBLE_MODEL")],
        apiKeyEnvVar: "OPENAI_COMPATIBLE_API_KEY",
        gateway: this.id,
        url: this.baseURL,
      },
    };
  }

  buildUrl(): string {
    return this.baseURL;
  }

  async getApiKey(): Promise<string> {
    return this.apiKey;
  }

  async resolveLanguageModel({
    apiKey,
    headers,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
    headers?: Record<string, string>;
    transport?: unknown;
    responsesWebSocket?: unknown;
  }): Promise<GatewayLanguageModel> {
    return createOpenAICompatible({
      name: "openai-compatible",
      apiKey,
      baseURL: this.baseURL,
      headers,
    }).chatModel(requireEnv("OPENAI_COMPATIBLE_MODEL"));
  }
}
