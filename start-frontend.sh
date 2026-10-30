#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "错误：未找到 npm。请先安装 Node.js 和 npm。" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "错误：尚未安装项目依赖。请先运行：npm ci" >&2
  exit 1
fi

exec npm run dev -- "$@"
