import { Mastra } from "@mastra/core/mastra";
import { MastraCompositeStore } from "@mastra/core/storage";
import { DuckDBStore } from "@mastra/duckdb";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import {
  MastraPlatformExporter,
  MastraStorageExporter,
  Observability,
  SensitiveDataFilter,
} from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { formAutomationAgent } from "./agents/form-automation-agent";
import { OpenaiCompatibleGateway } from "./gateways/openai-compatible-gateway";
import { normalizePinoChildBindings } from "./logger";

process.env.TZ = process.env.TZ?.trim() || "Asia/Shanghai";

async function createStorage(): Promise<MastraCompositeStore> {
  const storageType = process.env.STORAGE_TYPE || "libsql";
  const observabilityStore = await new DuckDBStore().getStore("observability");

  if (storageType === "postgres") {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/mastra";

    return new MastraCompositeStore({
      id: "composite-storage",
      default: new PostgresStore({
        id: "mastra-storage",
        connectionString,
        ssl:
          process.env.DATABASE_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
      }),
      domains: { observability: observabilityStore },
    });
  }

  return new MastraCompositeStore({
    id: "composite-storage",
    default: new LibSQLStore({
      id: "mastra-storage",
      url: process.env.LIBSQL_URL || "file:./mastra.db",
      ...(process.env.LIBSQL_AUTH_TOKEN
        ? { authToken: process.env.LIBSQL_AUTH_TOKEN }
        : {}),
    }),
    domains: { observability: observabilityStore },
  });
}

export const mastra = new Mastra({
  gateways: { openai: new OpenaiCompatibleGateway() },
  channels: {},
  agents: { formAutomationAgent },
  storage: await createStorage(),
  logger: normalizePinoChildBindings(
    new PinoLogger({ name: "Mastra", level: "info" }),
  ),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "agent-form-automate",
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
