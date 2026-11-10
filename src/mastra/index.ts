import { randomUUID } from "node:crypto";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";
import { Mastra } from "@mastra/core/mastra";
import { registerApiRoute } from "@mastra/core/server";
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

const RESOURCE_ID = "formAutomationAgent";

function pagination(pageValue?: string, perPageValue?: string) {
  const page = pageValue === undefined ? 0 : Number(pageValue);
  const perPage = perPageValue === undefined ? 20 : Number(perPageValue);
  if (
    !Number.isInteger(page) ||
    page < 0 ||
    !Number.isInteger(perPage) ||
    perPage < 1 ||
    perPage > 100
  )
    return null;
  return { page, perPage };
}

async function getMemory() {
  const memory = await formAutomationAgent.getMemory();
  if (!memory) throw new Error("Agent memory is unavailable");
  return memory;
}

function corsOrigin(): string {
  if (process.env.NODE_ENV === "development") return "*";
  const origin = process.env.FRONTEND_ORIGIN?.trim();
  if (!origin || origin === "*")
    throw new Error("FRONTEND_ORIGIN must be configured outside development");
  const url = new URL(origin);
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.origin !== origin
  )
    throw new Error("FRONTEND_ORIGIN must be a valid HTTP(S) origin");
  return origin;
}

export const mastra = new Mastra({
  gateways: { openai: new OpenaiCompatibleGateway() },
  channels: {},
  bundler: { externals: ["@copilotkit/runtime"] },
  server: {
    cors: {
      origin: corsOrigin(),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    },
    apiRoutes: [
      registerCopilotKit({ path: "/copilotkit", resourceId: RESOURCE_ID }),
      registerApiRoute("/sessions", {
        method: "POST",
        handler: async (c) => {
          const memory = await getMemory();
          const thread = await memory.createThread({
            threadId: randomUUID(),
            resourceId: RESOURCE_ID,
            title: "新会话",
          });
          return c.json(thread, 201);
        },
      }),
      registerApiRoute("/sessions", {
        method: "GET",
        handler: async (c) => {
          const options = pagination(
            c.req.query("page"),
            c.req.query("perPage"),
          );
          if (!options) return c.json({ error: "Invalid pagination" }, 400);
          const memory = await getMemory();
          return c.json(
            await memory.listThreads({
              ...options,
              filter: { resourceId: RESOURCE_ID },
              orderBy: { field: "updatedAt", direction: "DESC" },
            }),
          );
        },
      }),
      registerApiRoute("/sessions/:threadId/messages", {
        method: "GET",
        handler: async (c) => {
          const options = pagination(
            c.req.query("page"),
            c.req.query("perPage"),
          );
          if (!options) return c.json({ error: "Invalid pagination" }, 400);
          const memory = await getMemory();
          const threadId = c.req.param("threadId");
          const thread = await memory.getThreadById({ threadId });
          if (!thread || thread.resourceId !== RESOURCE_ID)
            return c.json({ error: "Session not found" }, 404);
          return c.json(await memory.recall({ threadId, ...options }));
        },
      }),
    ],
  },
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
