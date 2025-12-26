# Troubleshooting

## Template interpolation errors
- Symptom: Tests or packaging fail with `ReferenceError: amountClaimed is not defined` or similar errors originating from templates.
- Cause: Template strings in `TemplateLibrary.domainTemplates()` included unescaped `${...}` sequences which are evaluated by JS template literals.
- Fix: Escape dollar signs in templates (use `\${{amountClaimed}}`) or avoid using `${...}` expressions in the literal template content. Update templates in `src/core/templates/TemplateLibrary.ts` and re-run `npm test`.

## Missing template files in package
- Symptom: Generated package contains placeholder files and warnings like `Added placeholder for missing template file: drafts/checklist.md`.
- Cause: Template keys are missing from `TemplateLibrary` or `DocumentPackager` wasn't configured to include domain templates.
- Fix: Verify `TemplateLibrary.domainTemplates()` returns keys for required templates and that `DocumentPackager.assemble()` includes `templates/*.md` files. Add missing templates and re-run document generation.

## Form generation / requested templates
- Symptom: Requesting a specific template (e.g., Form 7A) returns an unexpected or empty result.
- Cause: The domain module may not be registered in the `DomainModuleRegistry` used by the server instance, or the `requestedTemplates` filter may not match draft titles if custom titles differ from template identifiers.
- Fix: Ensure the domain module (e.g., `CivilNegligenceDomainModule`) is registered at server bootstrap (`backend/src/server.ts`). If using `requestedTemplates`, verify that the template key maps correctly to draft titles (the system normalizes and tokenizes names but mismatches can occur). Add additional template aliases if needed and re-run generation.

## Common areas to cover:
- Installation issues (Node version, network, permissions)
- Test failures (TypeScript config, missing deps)
- Source access errors (API keys, blocked methods)
- Packaging problems (folder layout, manifests)
