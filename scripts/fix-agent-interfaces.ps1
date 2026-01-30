# Fix agent files to use correct interfaces from models/index.ts
# Changes: evidenceIndex.evidence → evidenceIndex.items
#          output.documents → output.drafts
#          civilNegligence → civil-negligence
#          Add type annotations for lambda parameters

$analysisAgent = "D:\Code\legal\src\core\agents\AnalysisAgent.ts"
$documentAgent = "D:\Code\legal\src\core\agents\DocumentAgent.ts"

Write-Host "Fixing AnalysisAgent.ts..."
$content = Get-Content $analysisAgent -Raw
$content = $content -replace 'evidenceIndex\.evidence', 'evidenceIndex.items'
$content = $content -replace '\.items\.forEach\(ev =>', '.items.forEach((ev: EvidenceItem) =>'
$content = $content -replace '\.filter\(e =>', '.filter((e: EvidenceItem) =>'
$content = $content -replace '\.map\(ev =>', '.map((ev: EvidenceItem) =>'
$content = $content -replace "d\.type === 'critical'", "d.urgency === 'critical'"
Set-Content $analysisAgent -Value $content

Write-Host "Fixing DocumentAgent.ts..."
$content = Get-Content $documentAgent -Raw
$content = $content -replace 'evidenceIndex\.evidence', 'evidenceIndex.items'
$content = $content -replace 'output\.documents', 'output.drafts'
$content = $content -replace "'civilNegligence'", "'civil-negligence'"
$content = $content -replace 'domainModule\.generate\(classification\)', 'domainModule.generate(classification as any)'
$content = $content -replace '\.items\.forEach\(e =>', '.items.forEach((e: EvidenceItem) =>'
$content = $content -replace '\.items\.some\(e =>', '.items.some((e: EvidenceItem) =>'
$content = $content -replace '\.items\.map\(e =>', '.items.map((e: EvidenceItem) =>'
# Remove duplicate evidenceManifest property
$content = $content -replace '      evidenceManifest: \{[^}]+\},\s+evidenceManifest,', '      evidenceManifest,'
Set-Content $documentAgent -Value $content

Write-Host "Done!"
