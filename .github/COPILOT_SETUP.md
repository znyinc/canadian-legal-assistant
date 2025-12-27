# GitHub Copilot Instructions Setup

This document explains the GitHub Copilot custom instructions configuration for this repository.

## Overview

This repository uses GitHub Copilot's custom instructions feature to provide AI assistants with project-specific context, coding standards, and legal compliance requirements.

## File Structure

```
.github/
├── copilot-instructions.md          # Main instructions (always applied)
└── instructions/
    └── snyk_rules.instructions.md   # Security scanning rules (always applied)
```

## Main Instructions File

**Location**: `.github/copilot-instructions.md`

### Structure

1. **YAML Frontmatter** - Metadata controlling when/how instructions apply
   - `alwaysApply: true` - Instructions active for all files
   - `description` - Brief summary of instructions purpose
   - `version` - Semantic version for tracking changes

2. **Project-Specific Sections** (## headings)
   - Quick Start - Tech stack, core references, build/test commands
   - Architecture and Components - System design patterns
   - Compliance and Boundaries - Legal information requirements (UPL)
   - Source Access Rules - Allowed legal data sources (CanLII, e-Laws)
   - Evidence Handling - File formats, PII redaction, metadata
   - Document Generation - Template usage, evidence-grounding
   - Testing and Quality - Dual testing approach (unit + property-based)
   - Workflows and Priorities - Implementation sequencing
   - Style and Tone - Output formatting, citation requirements
   - Security - Access control, tenant isolation

3. **General AI Assistant Guidelines** (# heading)
   - Enhanced instructions from multiple AI tools (Cursor, Devin, Claude Code, KIRO, etc.)
   - Operating modes (Planning, Implementation, Spec)
   - Context management and search strategies
   - Code editing best practices
   - Git/GitHub integration patterns
   - Quality controls and security rules

## Additional Instructions

**Location**: `.github/instructions/snyk_rules.instructions.md`

- Security scanning with Snyk
- Vulnerability fixing workflow
- Applied to all files via `alwaysApply: true`

## Best Practices

### When to Update Instructions

- Major architecture changes
- New legal compliance requirements
- Updated development workflows
- New domain modules or features
- Security policy changes

### Versioning

Update the `version` field in frontmatter using semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes to project structure or compliance rules
- **Minor** (1.0.0 → 1.1.0): New sections, expanded guidance, new features
- **Patch** (1.0.0 → 1.0.1): Typo fixes, clarifications, formatting improvements

### Testing Instructions

After updating instructions:

1. Test with GitHub Copilot in VS Code or GitHub.com editor
2. Verify AI assistant understands project context
3. Check that suggestions follow legal compliance rules
4. Ensure security patterns are enforced

## Resources

- [GitHub Copilot Custom Instructions Documentation](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Best Practices for Copilot Coding Agent](https://gh.io/copilot-coding-agent-tips)
- Project Design: `.kiro/specs/canadian-legal-assistant/design.md`
- Project Requirements: `.kiro/specs/canadian-legal-assistant/requirements.md`

## Current Version

**Version**: 1.0.0  
**Last Updated**: 2024-12-27  
**Maintainer**: Canadian Legal Assistant Team
