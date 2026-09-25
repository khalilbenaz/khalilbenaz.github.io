# Sessions Manager Suite 🚀

> **One window to run multiple AI CLI agent sessions in parallel.**
> The official multi-session workspace suite for **Claude Code** and **Google Antigravity CLI**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://khalilbenaz.github.io/sessions-manager/)

---

## 🌟 The Suite

| Tool | CLI Target | Ecosystem | Port | Repo & Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Sessions Manager** | `claude` | Anthropic Claude Code | `7890` | [GitHub](https://github.com/khalilbenaz/claude-sessions-manager) · [Live Docs](https://khalilbenaz.github.io/claude-sessions-manager/) |
| **AGY Sessions Manager** | `agy` | Google Antigravity | `7892` | [GitHub](https://github.com/khalilbenaz/agy-sessions-manager) · [Live Docs](https://khalilbenaz.github.io/agy-sessions-manager/) |

---

## ⚡ Quick Start

### 1. Claude Sessions Manager (`csm`)
For developers using **Claude Code** by Anthropic:

```bash
# Global install via npm
npm install -g claude-sessions-manager

# Install background service and command
csm install

# Open web interface or native app
csm open
```

Or download native packages from [Claude Sessions Releases](https://github.com/khalilbenaz/claude-sessions-manager/releases) (macOS `.dmg` and Windows `.exe`).

---

### 2. AGY Sessions Manager (`asm`)
For developers using **Antigravity CLI (`agy`)** by Google DeepMind:

```bash
# Global install via npm
npm install -g agy-sessions-manager

# Install background service and command
asm install

# Open web interface or native app
asm open
```

Or download native packages from [AGY Sessions Releases](https://github.com/khalilbenaz/agy-sessions-manager/releases) (macOS `.dmg` and Windows `.exe`).

---

## 💡 Running Both in Parallel

Both tools are engineered to co-exist harmoniously on the same machine without conflicts:
- **Claude Sessions Manager** runs locally on port `7890` (CLI command: `csm`)
- **AGY Sessions Manager** runs locally on port `7892` (CLI command: `asm`)

You can run both side-by-side to leverage Claude 3.7 Sonnet for coding alongside Gemini 3.8 Flash for high-speed analysis and documentation.

---

## 📄 License

MIT © [Khalil Benazzouz](https://github.com/khalilbenaz)
