#!/usr/bin/env node

import { getSecret } from "./keychain.js";
import type { SecretRefRequest, SecretRefResponse } from "./types.js";

async function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");

  for await (const chunk of process.stdin) {
    raw += chunk;
  }

  let request: SecretRefRequest;
  try {
    request = JSON.parse(raw || "{}");
  } catch {
    process.stderr.write("Failed to parse SecretRef request\n");
    process.exit(1);
  }

  const values: Record<string, string> = {};
  const errors: Record<string, { message: string }> = {};

  await Promise.all(
    (request.ids ?? []).map(async (id) => {
      const value = await getSecret(id);
      if (value !== null) {
        values[id] = value;
      } else {
        errors[id] = { message: `Secret '${id}' not found in OS keychain` };
      }
    }),
  );

  const response: SecretRefResponse = {
    protocolVersion: 1,
    values,
    ...(Object.keys(errors).length > 0 && { errors }),
  };

  process.stdout.write(JSON.stringify(response));
}

main().catch((err) => {
  process.stderr.write(`Resolver error: ${err.message}\n`);
  process.exit(1);
});
