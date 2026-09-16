#!/usr/bin/env bash

set -euo pipefail

base_sha="${1:-}"
head_sha="${2:-HEAD}"

if [[ -z "$base_sha" || "$base_sha" =~ ^0+$ ]] || ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  base_sha=$(git rev-list --max-parents=0 "$head_sha")
fi

if [[ "$base_sha" == "$head_sha" ]]; then
  exit 0
fi

commit_pattern='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|ops)(\([[:alnum:]._/-]+\))?!?: .+'

git log --format='%H%x09%s' "${base_sha}..${head_sha}" | {
  invalid=0

  while IFS=$'\t' read -r commit_sha subject; do
    if [[ "$subject" == Merge\ * ]]; then
      continue
    fi

    if [[ ! "$subject" =~ $commit_pattern ]]; then
      printf 'Invalid commit message: %.12s %s\n' "$commit_sha" "$subject" >&2
      invalid=1
    fi
  done

  if ((invalid)); then
    printf '%s\n' 'Use: type(scope): description. Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, ops.' >&2
  fi

  exit "$invalid"
}
