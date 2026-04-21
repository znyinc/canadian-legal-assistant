---
applyTo: "**"
description: Aikido MCP Security Guidance
---

# Project security best practices

- Aikido may run in the background as part of the local environment.
- Do not force or require Aikido scans during normal development unless the user explicitly asks for a scan.
- When a user requests a security scan, run it and share findings with actionable remediation steps.
- If the Aikido MCP server is unavailable and a scan is explicitly requested, share setup guidance:  
  https://help.aikido.dev/ide-plugins/aikido-mcp