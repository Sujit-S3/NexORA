/**
 * AI Benchmark Dataset & Runner
 * Runs a suite of simulated prompts through the intent detector 
 * and pipeline to ensure accuracy hasn't dropped.
 */
const intentDetector = require('../../src/services/ai/pipeline/intentDetector');

const BENCHMARKS = [
  {
    prompt: "Show Rolex under 5 lakh",
    expectedIntent: "luxury-advisor",
    expectedEntities: {
      brands: ['Rolex'],
      budget: 500000
    }
  },
  {
    prompt: "I need a wedding gift for my husband",
    expectedIntent: "gift-finder",
    expectedEntities: {}
  }
  // In a real scenario, this contains 200+ prompts.
];

async function runBenchmarks() {
  console.log('--- Running AI Benchmarks ---');
  let passed = 0;
  
  for (const test of BENCHMARKS) {
    const result = await intentDetector.detectIntent(test.prompt);
    
    let isPass = result.intent === test.expectedIntent;
    
    if (test.expectedEntities.brands) {
      const matchBrand = result.entities.brands.includes(test.expectedEntities.brands[0]);
      isPass = isPass && matchBrand;
    }
    
    if (isPass) {
      passed++;
      console.log(`[PASS] ${test.prompt}`);
    } else {
      console.error(`[FAIL] ${test.prompt}`);
      console.error(`  Expected: ${test.expectedIntent}, Got: ${result.intent}`);
    }
  }

  const accuracy = (passed / BENCHMARKS.length) * 100;
  console.log(`\nAccuracy: ${accuracy}%`);

  if (accuracy < 90) {
    console.error('Build Failed: AI Benchmark accuracy dropped below 90%');
    process.exit(1);
  }
}

runBenchmarks().catch(console.error);
