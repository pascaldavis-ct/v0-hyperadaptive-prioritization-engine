// This script runs the test suite and outputs results
// Run with: npx vitest run

import { execSync } from 'child_process'

try {
  const output = execSync('npx vitest run --reporter=verbose', {
    encoding: 'utf-8',
    stdio: 'inherit',
  })
  console.log(output)
} catch (error) {
  console.error('Tests failed')
  process.exit(1)
}
