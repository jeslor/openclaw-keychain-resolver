# openclaw-keychain-resolver

> Store your OpenClaw secrets in your **native OS keychain** — never in plaintext files again.

[![npm version](https://img.shields.io/npm/v/openclaw-keychain-resolver)](https://www.npmjs.com/package/openclaw-keychain-resolver)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)](#os-compatibility)

---

## What is it?

OpenClaw supports a `SecretRef` system that lets you pull secrets from external sources instead of storing them in plaintext. One of those sources is `exec` — you point OpenClaw at a binary, it sends a JSON request on stdin, and the binary returns secret values on stdout.

**`openclaw-keychain-resolver`** is that binary. It bridges OpenClaw's `exec` SecretRef protocol to your operating system's native, encrypted keychain:

| OS      | Backend                           |
| ------- | --------------------------------- |
| macOS   | Keychain (via Security framework) |
| Linux   | libsecret / GNOME Keyring         |
| Windows | DPAPI / Credential Manager        |

This means your API keys (Anthropic, OpenAI, GitHub tokens, etc.) are:

- **Encrypted at rest** by the OS, not by you
- **Unlocked only when your user session is active**
- **Never written to disk in plaintext**
- **Not visible to other users on the same machine**

This directly addresses [OpenClaw Issue #43794](https://github.com/openclaw/openclaw/issues/43794) and the `T-PERSIST-001` risk in OpenClaw's THREAT-MODEL-ATLAS.

---

## Install

### Option A — OpenClaw Plugin (Recommended)

Install as a managed OpenClaw plugin. OpenClaw auto-configures the `os-keychain` SecretRef provider — no manual `openclaw.json` edits needed.

**Prerequisites (native build tools):**

- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt install libsecret-1-dev` (Debian/Ubuntu) or `sudo dnf install libsecret-devel` (Fedora)
- **Windows**: No extra steps

```bash
openclaw plugins install openclaw-keychain-resolver --dangerously-force-unsafe-install
```

After install, the `os-keychain` provider is available in your `openclaw.json`:

```json
{
  "secrets": {
    "providers": {
      "os-keychain": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "openclaw-keychain-resolver",
          "integrationId": "os-keychain"
        }
      }
    }
  }
}
```

### Option B — Global npm (Manual exec config)

```bash
npm install -g openclaw-keychain-resolver
```

> **Prerequisites:**
>
> - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
> - **Linux**: `sudo apt install libsecret-1-dev` (Debian/Ubuntu) or `sudo dnf install libsecret-devel` (Fedora)
> - **Windows**: No extra steps — DPAPI is built in

---

## Usage

Use the `ckg` CLI to manage secrets in your keychain:

```bash
# Store a secret
ckg set ANTHROPIC_API_KEY sk-ant-your-key-here
ckg set OPENAI_API_KEY sk-your-openai-key
ckg set GITHUB_TOKEN ghp_your-token-here

# Retrieve a secret (prints raw value, safe to pipe)
ckg get ANTHROPIC_API_KEY

# List all stored key names (values are never shown)
ckg list

# Delete a secret
ckg delete ANTHROPIC_API_KEY

# Bulk import from ~/.openclaw/.env (migrating existing setup)
ckg import-env
```

---

## Manual exec config

> This section is for **Option B** (global npm install). If you used the OpenClaw plugin install, this is auto-configured for you.

Find the resolver path, then add it to your `openclaw.json`:

```bash
which openclaw-keychain-resolver
# e.g. /usr/local/bin/openclaw-keychain-resolver
```

```json
{
  "secrets": {
    "providers": {
      "keychain": {
        "source": "exec",
        "command": "/usr/local/bin/openclaw-keychain-resolver",
        "jsonOnly": true
      }
    }
  }
}
```

Then reference it in your model or tool config:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "secretRef": { "provider": "keychain", "id": "ANTHROPIC_API_KEY" }
    }
  }
}
```

OpenClaw will call the resolver automatically — your key never touches a file.

---

## OS Compatibility

| Platform      | Keychain Backend                    | Status    |
| ------------- | ----------------------------------- | --------- |
| macOS 12+     | macOS Keychain (Security.framework) | ✅ Tested |
| Ubuntu 20.04+ | libsecret / GNOME Keyring           | ✅ Tested |
| Fedora 36+    | libsecret / KWallet                 | ✅ Tested |
| Windows 10/11 | DPAPI / Credential Manager          | ✅ Tested |

---

## How it works

OpenClaw's `exec` SecretRef protocol:

1. OpenClaw spawns the resolver binary
2. Sends JSON on `stdin`:
   ```json
   {
     "protocolVersion": 1,
     "provider": "keychain",
     "ids": ["ANTHROPIC_API_KEY"]
   }
   ```
3. Resolver fetches each key from the OS keychain and writes JSON to `stdout`:
   ```json
   { "protocolVersion": 1, "values": { "ANTHROPIC_API_KEY": "sk-ant-..." } }
   ```
4. OpenClaw injects the values as environment variables — they never touch disk

---

## Contributing

Issues and PRs welcome. This package was built specifically to close [openclaw/openclaw#43794](https://github.com/openclaw/openclaw/issues/43794).

```bash
git clone https://github.com/YOUR_USERNAME/openclaw-keychain-resolver
cd openclaw-keychain-resolver
npm install
npm run build
```

---

## License

MIT © [License](https://github.com/jeslor/openclaw-keychain-resolver/blob/main/LICENSE)
