$tests = @(
  "backend/src/chat/message_library_validation_test.ts",
  "backend/src/chat/cx_audit_test.ts",
  "backend/src/chat/citizen_frustration_test.ts",
  "backend/src/chat/workflow_parity_test.ts",
  "backend/src/chat/stability_test.ts",
  "backend/src/chat/comprehensive_test.ts"
)

foreach ($test in $tests) {
  Write-Host ""
  Write-Host "=========================================="
  Write-Host "Running $test..."
  Write-Host "=========================================="
  npx ts-node --compiler-options '{\"module\":\"commonjs\"}' $test
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Test failed: $test"
    exit 1
  }
}
Write-Host "All tests passed successfully!"
