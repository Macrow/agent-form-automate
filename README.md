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
