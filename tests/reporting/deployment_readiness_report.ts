import * as fs from 'fs';
import * as path from 'path';

export function generateReadinessReport(jestResultPath: string) {
  const resultRaw = fs.readFileSync(jestResultPath, 'utf8');
  const results = JSON.parse(resultRaw);

  const totalSuites = results.numTotalTestSuites;
  const passedSuites = results.numPassedTestSuites;
  const totalTests = results.numTotalTests;
  const passedTests = results.numPassedTests;

  let baseScore = 0;
  if (totalTests > 0) {
    baseScore = (passedTests / totalTests) * 100;
  }

  // Weight logic as defined: 
  // Functional 20%, Workflow 15%, Database 15%, Security 15%, Stability 10%, CX 10%, Integration 10%, Performance 5%
  // This can be enhanced by grouping test results by folder or filename.

  console.log("==================================================");
  console.log("       DEPLOYMENT READINESS REPORT               ");
  console.log("==================================================");
  console.log(`Total Suites: ${totalSuites}`);
  console.log(`Passed Suites: ${passedSuites}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Base Score: ${baseScore.toFixed(2)}/100`);
  
  if (baseScore >= 90) {
    console.log("STATUS: [STAGING READY]");
  } else {
    console.log("STATUS: [NOT READY]");
  }
  console.log("==================================================");
}

// Allow running from command line
if (require.main === module) {
  const resultPath = process.argv[2] || path.resolve(__dirname, '../../jest-results.json');
  if (fs.existsSync(resultPath)) {
    generateReadinessReport(resultPath);
  } else {
    console.error(`Could not find Jest JSON results at: ${resultPath}`);
    console.log("Please run 'npx jest --json --outputFile=jest-results.json' first.");
  }
}
