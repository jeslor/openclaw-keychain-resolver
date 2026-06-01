#!/usr/bin/env node
import { getSecret, setSecret, deleteSecret, listSecrets } from "./keychain.js";

const [, , command, key, value] = process.argv;

async function main() {
  switch (command) {
    case "set": {
      if (!key || !value) {
        console.error("Usage: ckg set <KEY> <value>");
        process.exit(1);
      }
      await setSecret(key, value);
      console.log(`✅ Stored '${key}' in OS keychain`);
      break;
    }
    case "get": {
      if (!key) {
        console.error("Usage: ckg get <KEY>");
        process.exit(1);
      }
      const result = await getSecret(key);
      if (result === null) {
        console.error(`❌ Secret '${key}' not found`);
        process.exit(1);
      }
      process.stdout.write(result);
      break;
    }
    case "delete": {
      if (!key) {
        console.error("Usage: ckg delete <KEY>");
        process.exit(1);
      }
      const deleted = await deleteSecret(key);
      console.log(deleted ? `🗑️  Deleted '${key}'` : `❌ '${key}' not found`);
      break;
    }
    case "list": {
      const creds = await listSecrets();
      if (creds.length === 0) {
        console.log("No secrets stored yet.");
      } else {
        console.log("Stored keys:");
        creds.forEach((c) => console.log(`  • ${c.account}`));
      }
      break;
    }
    case "import-env": {
      // Import from ~/.openclaw/.env
      const fs = await import("fs");
      const os = await import("os");
      const path = await import("path");
      const envPath = path.join(os.homedir(), ".openclaw", ".env");
      if (!fs.existsSync(envPath)) {
        console.error(`No .env found at ${envPath}`);
        process.exit(1);
      }
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      let count = 0;
      for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z0-9_]+)=(.+)$/);
        if (match && match[1] && match[2]) {
          await setSecret(match[1], match[2].replace(/^["']|["']$/g, ""));
          console.log(`  ✅ Imported ${match[1]}`);
          count++;
        }
      }
      console.log(`\nImported ${count} secrets from ${envPath}`);
      break;
    }
    default:
      console.log(`
 openclaw-keychain-resolver (ckg) — Native OS Keychain for OpenClaw
 
 Commands:
   ckg set <KEY> <value>    Store a secret in the OS keychain
   ckg get <KEY>            Get a secret value
   ckg delete <KEY>         Remove a secret
   ckg list                 List all stored secret names
   ckg import-env           Import secrets from ~/.openclaw/.env
 
 OpenClaw config (openclaw.json):
   {
     "secrets": {
       "providers": {
         "keychain": {
           "source": "exec",
           "command": "$(which openclaw-keychain-resolver)",
           "jsonOnly": true
         }
       }
     }
   }
 `);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
