$tests = @(
  "tests/localization/message_library_validation.spec.ts",
  "tests/cx/cx_audit.spec.ts",
  "tests/cx/citizen_frustration.spec.ts",
  "tests/integration/workflow_parity.spec.ts",
  "tests/resilience/stability.spec.ts"
)

foreach ($test in $tests) {
  Write-Host ""
  Write-Host "=========================================="
  Write-Host "Running $test..."
  Write-Host "=========================================="
  npx jest $test --runInBand
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Test failed: $test"
    exit 1
  }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Running backend/src/chat/comprehensive_test.ts..."
Write-Host "=========================================="
npx ts-node --compiler-options '{\"module\":\"commonjs\"}' backend/src/chat/comprehensive_test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Error "Test failed: backend/src/chat/comprehensive_test.ts"
  exit 1
}

Write-Host "All tests passed successfully!"
