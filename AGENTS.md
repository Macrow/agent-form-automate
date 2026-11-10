# 项目开发规范

## 项目定位

- 本项目是表单自动化 Agent 服务。
- 当前 Agent 用于澄清和整理表单填写需求；尚未接入表单系统工具时，不得声称已经填写、修改或提交表单。

## Mastra 组件

- 在 `src/mastra/index.ts` 注册 Agent、工具、工作流、模型网关、渠道及存储组件。
- Agent 定义放在 `src/mastra/agents/`，工具放在 `src/mastra/tools/`，工作流放在 `src/mastra/workflows/`，模型网关放在 `src/mastra/gateways/`。
- 使用 Mastra API 前，先阅读项目 skill：`.agents/skills/mastra/SKILL.md`。优先核对已安装依赖中的文档和类型；缺少本地文档时查阅 Mastra 官方文档。

## 渠道与鉴权

- 目前不注册任何 channel；Smart IM 及其他渠道待后续明确对接后再添加。
- 不添加 Auth Prime 或其他业务系统鉴权集成，除非项目需求明确提出。

## 会话记忆

- Agent 会话历史使用 `@mastra/memory`，并由 Mastra storage 持久化。
- `OBSERVATIONAL_MEMORY_ENABLED` 默认启用长期对话压缩记忆；设置为 `false`、`0`、`no` 或 `off` 时关闭。
- 关闭压缩记忆后，`MESSAGE_HISTORY_MAX_TOKENS` 控制上下文 token 预算，默认 `8000`。
- 使用线程记忆时，调用方必须为同一会话持续提供相同的 thread ID。

## 开发与检查

- 使用 `pnpm run dev` 启动开发服务，使用 `pnpm run build` 构建；不要直接调用 Mastra CLI。
- 修改后运行 `pnpm run lint:fix`；修改 TypeScript 后运行 `pnpm run typecheck`。
- 保持 TypeScript strict，不使用隐式 `any` 或不安全的宽泛类型断言。
- 环境变量从 `.env.example` 配置；不得提交实际密钥或凭据。
