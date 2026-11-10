import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { OPENAI_COMPATIBLE_MODEL_ID } from "../gateways/openai-compatible-gateway";

const DEFAULT_LAST_MESSAGES = 20;
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

const getLastMessages = () => {
  const value = process.env.LAST_MESSAGES?.trim();

  if (!value) return DEFAULT_LAST_MESSAGES;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_LAST_MESSAGES;
};

export const formAutomationAgent = new Agent({
  id: "form-automation-agent",
  name: "Form Automation Agent",
  instructions: `你是表单自动化助手，帮助用户梳理表单填写需求和所需信息。

当前尚未接入表单系统或表单操作工具，因此不能声称已经填写、修改或提交任何表单。用户信息不完整时，清楚地询问缺失内容；整理结果时使用标准 Markdown。`,
  model: OPENAI_COMPATIBLE_MODEL_ID(),
  memory: new Memory({
    options: {
      lastMessages: getLastMessages(),
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
