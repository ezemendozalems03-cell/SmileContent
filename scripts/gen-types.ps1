# Regenerates src/lib/types/database.types.ts from the live, linked Supabase
# project. Run this once the project is linked (see README "Conectar Supabase").
#
# Usage: ./scripts/gen-types.ps1 -ProjectId your-project-ref

param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId
)

npx supabase gen types typescript --project-id $ProjectId --schema public |
  Out-File -FilePath "src/lib/types/database.types.ts" -Encoding utf8

Write-Host "Regenerated src/lib/types/database.types.ts from project $ProjectId"
Write-Host "Review the diff -- domain.ts and any hand-written Enums/labels may need updating too."
