import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Rate limiting in-memory store: Map<addressOrIp, timestamp>
const claimHistory = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown per address/IP
const BANK_ACCOUNT = 'default';
const DEFAULT_DISPENSE_AMOUNT = 100;
const MIN_BANK_RESERVE = 5000;
const REFILL_AMOUNT = 10000;

async function runThruCommand(args) {
  try {
    const { stdout } = await execFileAsync('thru', ['--json', ...args], {
      timeout: 30000,
      env: process.env
    });
    return { success: true, data: JSON.parse(stdout.trim()) };
  } catch (err) {
    let parsed = null;
    if (err.stdout) {
      try { parsed = JSON.parse(err.stdout); } catch (_) {}
    }
    return {
      success: false,
      error: err.stderr?.trim() || err.message,
      data: parsed
    };
  }
}

/**
 * Gets bank status and balance
 */
export async function getFaucetInfo() {
  const balRes = await runThruCommand(['getbalance', BANK_ACCOUNT]);
  if (!balRes.success) {
    return {
      status: 'offline',
      error: balRes.error,
      bankAccount: BANK_ACCOUNT,
      balance: 0,
      dispenseAmount: DEFAULT_DISPENSE_AMOUNT,
      cooldownMinutes: Math.round(COOLDOWN_MS / 60000)
    };
  }

  const balance = balRes.data?.balance?.balance || 0;
  const pubkey = balRes.data?.balance?.pubkey || '';

  // Trigger background refill if reserve is low
  if (balance < MIN_BANK_RESERVE) {
    runThruCommand(['faucet', 'withdraw', BANK_ACCOUNT, String(REFILL_AMOUNT)]).catch(() => {});
  }

  return {
    status: 'online',
    bankAccount: BANK_ACCOUNT,
    pubkey,
    balance,
    dispenseAmount: DEFAULT_DISPENSE_AMOUNT,
    cooldownMinutes: Math.round(COOLDOWN_MS / 60000)
  };
}

/**
 * Claims tokens from the bank wallet to the recipient
 */
export async function claimFromBank(recipient, amount = DEFAULT_DISPENSE_AMOUNT, clientIp = 'unknown') {
  const cleanRecipient = recipient?.trim();

  if (!cleanRecipient) {
    return { success: false, error: 'Recipient address or key name is required.' };
  }

  // Validate amount (keep it capped per request for safety)
  const numAmount = Math.min(Math.max(Number(amount) || DEFAULT_DISPENSE_AMOUNT, 10), 1000);

  // Rate limit check by address and IP
  const now = Date.now();
  const lastClaimAddr = claimHistory.get(cleanRecipient) || 0;
  const lastClaimIp = claimHistory.get(clientIp) || 0;

  if (now - lastClaimAddr < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastClaimAddr)) / 1000);
    return { success: false, error: `Cooldown active for this address. Please wait ${remainingSec} seconds.` };
  }

  if (clientIp !== 'unknown' && now - lastClaimIp < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastClaimIp)) / 1000);
    return { success: false, error: `Cooldown active for your IP. Please wait ${remainingSec} seconds.` };
  }

  // Execute transfer from bank wallet to recipient
  const res = await runThruCommand(['transfer', BANK_ACCOUNT, cleanRecipient, String(numAmount)]);

  if (!res.success) {
    // If recipient is unknown/not registered yet, attempt official faucet withdrawal directly to that address
    const fallbackRes = await runThruCommand(['faucet', 'withdraw', cleanRecipient, String(numAmount)]);
    if (fallbackRes.success) {
      claimHistory.set(cleanRecipient, now);
      claimHistory.set(clientIp, now);
      return {
        success: true,
        recipient: cleanRecipient,
        amount: numAmount,
        signature: fallbackRes.data?.faucet_withdraw?.signature || 'confirmed',
        slot: fallbackRes.data?.faucet_withdraw?.slot,
        source: 'faucet-direct'
      };
    }

    return {
      success: false,
      error: res.data?.error?.message || res.error || 'Transfer failed on network'
    };
  }

  // Record successful claim
  claimHistory.set(cleanRecipient, now);
  claimHistory.set(clientIp, now);

  return {
    success: true,
    recipient: cleanRecipient,
    amount: numAmount,
    signature: res.data?.transfer?.signature || res.data?.signature || 'confirmed',
    slot: res.data?.transfer?.slot || res.data?.slot,
    source: 'bank-wallet'
  };
}

/**
 * Creates a new test wallet on-chain if user requests one
 */
export async function createQuickWallet() {
  const name = `user_${Date.now().toString().slice(-6)}`;
  const genRes = await runThruCommand(['keys', 'generate', name]);
  if (!genRes.success) {
    return { success: false, error: genRes.error };
  }

  const accRes = await runThruCommand(['account', 'create', name]);
  const pubkey = accRes.data?.account_create?.public_key || '';

  return {
    success: true,
    name,
    pubkey,
    privateKeyHex: genRes.data?.keys?.value || ''
  };
}
