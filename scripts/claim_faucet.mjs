#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const account = process.argv[2] || 'default';
const totalClaims = parseInt(process.argv[3] || '100', 10);

console.log('='.repeat(60));
console.log('  Thru Betanet Faucet Auto-Claimer (Node.js)');
console.log(`  Target Account : ${account}`);
console.log(`  Claims count   : ${totalClaims.toLocaleString()}`);
console.log(`  Target Yield   : ${(totalClaims * 10000).toLocaleString()} THRU`);
console.log('  Press Ctrl+C at any time to halt safely.');
console.log('='.repeat(60));

let successes = 0;
let failures = 0;

process.on('SIGINT', () => {
  console.log(`\n\nProcess halted. Successfully claimed: ${successes} batches (${(successes * 10000).toLocaleString()} THRU)`);
  process.exit(0);
});

async function runClaim(index) {
  try {
    process.stdout.write(`[${index}/${totalClaims}] Requesting 10,000 THRU... `);
    const { stdout } = await execFileAsync('thru', ['faucet', 'withdraw', account, '10000']);
    if (stdout.includes('Withdraw completed successfully')) {
      const match = stdout.match(/Transaction signature:\s*([^\s]+)/);
      const sig = match ? match[1].slice(0, 16) + '...' : 'confirmed';
      console.log(`✅ SUCCESS! (sig: ${sig})`);
      successes++;
    } else {
      console.log(`⚠️ Output: ${stdout.trim()}`);
      failures++;
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message.split('\n')[0]}`);
    failures++;
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  for (let i = 1; i <= totalClaims; i++) {
    await runClaim(i);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('='.repeat(60));
  console.log(` Finished! Total Claimed: ${(successes * 10000).toLocaleString()} THRU`);
  console.log(` Failures: ${failures}`);
  console.log('='.repeat(60));
}

main();
