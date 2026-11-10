import type { PinoLogger } from "@mastra/loggers";

/** Accept both Mastra's string component names and Pino's binding objects. */
export const normalizePinoChildBindings = (logger: PinoLogger): PinoLogger => {
  const originalChild = logger.child.bind(logger);
  logger.child = (bindings: Record<string, unknown> | string) =>
    normalizePinoChildBindings(
      originalChild(
        typeof bindings === "string" ? { component: bindings } : bindings,
      ),
    );
  return logger;
};
