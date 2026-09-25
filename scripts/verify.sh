#!/usr/bin/env bash
# 完成条件的唯一裁判。三步全过才算做完：行为测试、植入 bug 必须被抓住、真浏览器端到端。
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== 1/3 行为测试 (P1-P6 的纯逻辑部分)"; node --test test/*.test.js 2>&1 | grep -E '^(ok|not ok)|^# (pass|fail)'
echo "== 2/3 变异检查 (测试自己会不会失败)"; node scripts/mutation-check.mjs
echo "== 3/3 端到端 (真浏览器, 北京时区, 早上 7 点)"; node test-e2e/run.mjs
echo "VERIFIED"
