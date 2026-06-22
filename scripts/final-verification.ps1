$ErrorActionPreference = "Stop"

Write-Host "Running db:cleanup-sessions"
npm run db:cleanup-sessions
if ($LASTEXITCODE -ne 0) { throw "db:cleanup-sessions failed" }
Write-Host "__SESSION_CLEANUP_DONE__"

Write-Host "Running db:cleanup-chat"
npm run db:cleanup-chat
if ($LASTEXITCODE -ne 0) { throw "db:cleanup-chat failed" }
Write-Host "__CHAT_CLEANUP_DONE__"

Write-Host "Running db:benchmark"
npm run db:benchmark
if ($LASTEXITCODE -ne 0) { throw "db:benchmark failed" }
Write-Host "__BENCHMARK_DONE__"

Write-Host "Running db:optimize-dev"
npm run db:optimize-dev
if ($LASTEXITCODE -ne 0) { throw "db:optimize-dev failed" }
Write-Host "__OPTIMIZATION_DONE__"

Write-Host "Running database tests"
npx jest tests/database --runInBand
if ($LASTEXITCODE -ne 0) { throw "database tests failed" }
Write-Host "__DATABASE_TESTS_DONE__"
