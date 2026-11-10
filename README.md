# agent-form-automate

基于 Mastra 的表单自动化 Agent 服务基础工程。已初始化基础 Agent、会话历史记忆、模型网关、存储和可观测性；表单业务工具及渠道将在后续对接时补充。

## 开始

```shell
cp .env.example .env
pnpm install
pnpm run dev
```

服务启动后可在 Mastra Studio 访问 `http://localhost:4111`。

## 配置

- `OPENAI_COMPATIBLE_BASE_URL`、`OPENAI_COMPATIBLE_API_KEY`、`OPENAI_COMPATIBLE_MODEL`：OpenAI-compatible 模型网关配置。
- `OBSERVATIONAL_MEMORY_ENABLED`：是否启用长期对话压缩记忆，默认 `true`；设为 `false`、`0`、`no` 或 `off` 时关闭。
- `LAST_MESSAGES`：关闭 Observational Memory 后，每次加载到 Agent 上下文的最近消息数，默认 `20`。
- `TZ`：应用时区，默认 `Asia/Shanghai`。
- `STORAGE_TYPE`：`libsql`（默认）或 `postgres`。
- `LIBSQL_URL`、`LIBSQL_AUTH_TOKEN`：LibSQL 存储配置。
- `DATABASE_URL`、`DATABASE_SSL`：PostgreSQL 存储配置。

当前没有注册任何 channel；Smart IM 及其他渠道留待后续对接。当前也不包含 Auth Prime 或其他业务鉴权集成。

## CopilotKit 与会话

`pnpm run dev` 自动设置 `NODE_ENV=development`，开发环境允许所有跨域来源。生产环境必须将 `FRONTEND_ORIGIN` 配置为完整的前端 origin，不能使用 `*`。CopilotKit runtime 路径为 `/copilotkit`，agent 名称为 `formAutomationAgent`。

- `POST /sessions`：创建会话，返回带 UUID 的 thread。
- `GET /sessions?page=0&perPage=20`：分页获取会话。
- `GET /sessions/{threadId}/messages?page=0&perPage=20`：分页获取历史消息。

前端为同一会话持续使用返回的 thread ID。当前固定 resource ID，不提供用户隔离或鉴权，不适合直接暴露给不受信任的用户。历史消息使用 Mastra 数据格式，前端需要转换为其 UI 所需格式；该接口不提供 AG-UI 事件重放或断线续流。
