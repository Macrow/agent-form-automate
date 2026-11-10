import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { OPENAI_COMPATIBLE_MODEL_ID } from "../gateways/openai-compatible-gateway";

const DEFAULT_MESSAGE_HISTORY_MAX_TOKENS = 8000;
const OBSERVATIONAL_MEMORY_DISABLED_VALUES = new Set([
  "0",
  "false",
  "no",
  "off",
]);

const isObservationalMemoryEnabled = () => {
  const value = process.env.OBSERVATIONAL_MEMORY_ENABLED;

  return (
    value === undefined ||
    !OBSERVATIONAL_MEMORY_DISABLED_VALUES.has(value.trim().toLowerCase())
  );
};

const getMessageHistoryMaxTokens = () => {
  const value = process.env.MESSAGE_HISTORY_MAX_TOKENS?.trim();

  if (!value) return DEFAULT_MESSAGE_HISTORY_MAX_TOKENS;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MESSAGE_HISTORY_MAX_TOKENS;
};

export const formAutomationAgent = new Agent({
  id: "form-automation-agent",
  name: "Form Automation Agent",
  instructions: `你是表单自动化助手，帮助用户梳理表单填写需求和所需信息。

当前页面可能提供前端表单工具。仅在工具可用且用户明确提供信息时调用工具填写表单；字段或选项不明确时先追问。不得声称未成功的操作已经完成，不得提交表单；填写后提醒用户检查并手动提交。整理结果时使用标准 Markdown。`,
  model: OPENAI_COMPATIBLE_MODEL_ID(),
  memory: new Memory({
    options: {
      ...(isObservationalMemoryEnabled()
        ? {}
        : { messageHistory: { maxTokens: getMessageHistoryMaxTokens() } }),
      observationalMemory: isObservationalMemoryEnabled()
        ? {
            model: OPENAI_COMPATIBLE_MODEL_ID(),
            observation: {
              instruction:
                "整理对后续表单协助有用的用户偏好、已确认信息、当前任务和待补充内容；不要记录密钥、密码或其他不必要的敏感信息。",
            },
          }
        : false,
    },
  }),
});
