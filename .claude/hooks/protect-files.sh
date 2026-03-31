#!/bin/bash
# PreToolUse hook: Hassas dosyalari Edit/Write'dan koru
# Exit 2 = BLOCK, Exit 0 = ALLOW

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# .env dosyalari
if [[ "$FILE_PATH" =~ \.env($|\.local|\.production|\.staging|\.test|\.development) ]]; then
  echo "BLOCKED: .env files are protected." >&2
  exit 2
fi

# Lock dosyalari
if [[ "$FILE_PATH" == *"pnpm-lock.yaml"* ]] || [[ "$FILE_PATH" == *"package-lock.json"* ]] || [[ "$FILE_PATH" == *"yarn.lock"* ]]; then
  echo "BLOCKED: Lock files should only be modified by the package manager." >&2
  exit 2
fi

# .git dizini
if [[ "$FILE_PATH" == *"/.git/"* ]]; then
  echo "BLOCKED: .git directory should not be edited directly." >&2
  exit 2
fi

# Credentials
if [[ "$FILE_PATH" == *"credentials"* ]] || [[ "$FILE_PATH" == *"secrets"* ]] || [[ "$FILE_PATH" == *"service-account"* ]]; then
  echo "BLOCKED: Credential files are protected." >&2
  exit 2
fi

exit 0
