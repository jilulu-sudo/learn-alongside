// 终幕的布：竖线是前面七章讲过的内核，横线是官方 onboarding 列出的“开箱即有”的能力。
// uses 表示这项能力建在哪几根竖线上，交叉处打一个结。
export const WARP = [
  { id: 'value', name: '值', chapter: 'value' },
  { id: 'gen', name: '步骤', chapter: 'gen' },
  { id: 'errors', name: '错误', chapter: 'errors' },
  { id: 'time', name: '时间', chapter: 'retry' },
  { id: 'fibers', name: '纤程', chapter: 'fibers' },
  { id: 'layers', name: '依赖', chapter: 'layers' },
  { id: 'scope', name: '资源', chapter: 'scope' },
];

export const THREADS = [
  { id: 'errors', name: '类型化错误', line: '失败写在签名里，像数据一样处理', api: 'Effect.fail · catchTag · Cause', uses: ['value', 'gen', 'errors'] },
  { id: 'schedule', name: '重试与调度', line: '组合出来的退避策略，而不是手写的循环', api: 'Schedule · Effect.retry · Effect.repeat', uses: ['value', 'errors', 'time'] },
  { id: 'concurrency', name: '结构化并发', line: '有上限的并行，结束后自己收拾干净', api: 'Effect.all · Effect.race · Fiber', uses: ['value', 'errors', 'fibers'] },
  { id: 'resources', name: '资源安全', line: '拿了就一定还，失败和中断时也一样', api: 'Scope · Effect.acquireRelease', uses: ['value', 'fibers', 'scope'] },
  { id: 'di', name: '依赖注入', line: '服务经由类型系统接线，测试时随手替换', api: 'Context.Service · Layer', uses: ['value', 'layers', 'scope'] },
  { id: 'observability', name: '可观测性', line: '追踪、指标、结构化日志内建在运行时里', api: 'Effect.fn · withSpan · Metric · Logger', uses: ['value', 'gen', 'fibers', 'layers'] },
  { id: 'stream', name: '流', line: '带背压的流，用的是同一套算子', api: 'Stream · Sink · Channel', uses: ['value', 'errors', 'time', 'fibers', 'scope'] },
  { id: 'schema', name: 'Schema', line: '解析和转换数据，让类型与现实一致', api: 'Schema.decodeUnknown · Schema.Class', uses: ['value', 'errors'] },
  { id: 'config', name: '配置', line: '从环境读出带类型的配置，启动时校验，密钥打码', api: 'Config · Redacted', uses: ['value', 'errors', 'layers'] },
  { id: 'ecosystem', name: '同一个生态', line: 'HTTP、SQL、CLI、AI、RPC、集群、工作流，建在同一个内核上', api: 'effect/http · effect/sql · effect/cli · effect/ai · effect/workflow', uses: ['value', 'gen', 'errors', 'time', 'fibers', 'layers', 'scope'] },
];
