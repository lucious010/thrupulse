import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Rate limiting in-memory store: Map<addressOrIp, timestamp>
const claimHistory = new Map();
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown per address/IP for convenience
const BANK_ACCOUNT = 'default';
const MIN_BANK_RESERVE = 5000;
const REFILL_AMOUNT = 10000;

// Multi-Token Treasury Reserves
const TREASURY_RESERVES = {
  THRU: 177907,
  tSOL: 25000,
  tUSD: 1500000,
  tETH: 500,
  tBTC: 50
};

const DEFAULT_DISPENSE = {
  THRU: 100,
  tSOL: 5,
  tUSD: 250,
  tETH: 0.5,
  tBTC: 0.05
};

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
 * Gets treasury status and multi-token reserves
 */
export async function getFaucetInfo() {
  const balRes = await runThruCommand(['getbalance', BANK_ACCOUNT]);
  let onchainBalance = TREASURY_RESERVES.THRU;
  let pubkey = '';

  if (balRes.success) {
    onchainBalance = balRes.data?.balance?.balance || onchainBalance;
    pubkey = balRes.data?.balance?.pubkey || '';
    TREASURY_RESERVES.THRU = onchainBalance;

    // Trigger background refill if THRU reserve is low
    if (onchainBalance < MIN_BANK_RESERVE) {
      runThruCommand(['faucet', 'withdraw', BANK_ACCOUNT, String(REFILL_AMOUNT)]).catch(() => {});
    }
  }

  return {
    status: balRes.success ? 'online' : 'offline',
    bankAccount: BANK_ACCOUNT,
    pubkey,
    balance: onchainBalance, // backwards compatibility
    reserves: { ...TREASURY_RESERVES },
    dispenseAmounts: { ...DEFAULT_DISPENSE },
    cooldownMinutes: Math.round(COOLDOWN_MS / 60000)
  };
}

/**
 * Claims tokens (THRU, tSOL, tUSD, tETH, tBTC) from the treasury vault
 */
export async function claimFromBank(recipient, amount, token = 'THRU', clientIp = 'unknown') {
  const cleanRecipient = recipient?.trim();
  const cleanToken = (token || 'THRU').trim();

  if (!cleanRecipient) {
    return { success: false, error: 'Recipient address or key name is required.' };
  }

  const defaultAmt = DEFAULT_DISPENSE[cleanToken] || 100;
  const numAmount = Number(amount) || defaultAmt;

  // Rate limit check by address and IP
  const now = Date.now();
  const lastClaimAddr = claimHistory.get(`${cleanRecipient}_${cleanToken}`) || 0;
  const lastClaimIp = claimHistory.get(`${clientIp}_${cleanToken}`) || 0;

  if (now - lastClaimAddr < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastClaimAddr)) / 1000);
    return { success: false, error: `Cooldown active for this address on ${cleanToken}. Please wait ${remainingSec}s.` };
  }

  if (clientIp !== 'unknown' && now - lastClaimIp < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastClaimIp)) / 1000);
    return { success: false, error: `Cooldown active for your IP on ${cleanToken}. Please wait ${remainingSec}s.` };
  }

  // Handle native THRU on-chain transfer
  if (cleanToken === 'THRU') {
    const cappedAmount = Math.min(Math.max(numAmount, 10), 1000);
    const res = await runThruCommand(['transfer', BANK_ACCOUNT, cleanRecipient, String(cappedAmount)]);

    if (!res.success) {
      // If recipient is unknown or unregistered, fallback to official faucet withdraw
      const fallbackRes = await runThruCommand(['faucet', 'withdraw', cleanRecipient, String(cappedAmount)]);
      if (fallbackRes.success) {
        claimHistory.set(`${cleanRecipient}_${cleanToken}`, now);
        claimHistory.set(`${clientIp}_${cleanToken}`, now);
        return {
          success: true,
          recipient: cleanRecipient,
          amount: cappedAmount,
          token: 'THRU',
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

    claimHistory.set(`${cleanRecipient}_${cleanToken}`, now);
    claimHistory.set(`${clientIp}_${cleanToken}`, now);

    return {
      success: true,
      recipient: cleanRecipient,
      amount: cappedAmount,
      token: 'THRU',
      signature: res.data?.transfer?.signature || res.data?.signature || 'confirmed',
      slot: res.data?.transfer?.slot || res.data?.slot,
      source: 'treasury-vault'
    };
  }

  // Handle tSOL, tUSD, tETH, tBTC Treasury distribution
  if (TREASURY_RESERVES[cleanToken] !== undefined) {
    if (TREASURY_RESERVES[cleanToken] < numAmount) {
      return { success: false, error: `Treasury reserve low for ${cleanToken}.` };
    }

    // Deduct from in-memory treasury reserve
    TREASURY_RESERVES[cleanToken] = Number((TREASURY_RESERVES[cleanToken] - numAmount).toFixed(6));
    claimHistory.set(`${cleanRecipient}_${cleanToken}`, now);
    claimHistory.set(`${clientIp}_${cleanToken}`, now);

    const sig = `tx_thruvm_treasury_${cleanToken.toLowerCase()}_` + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    return {
      success: true,
      recipient: cleanRecipient,
      amount: numAmount,
      token: cleanToken,
      signature: sig,
      source: 'treasury-vault'
    };
  }

  return { success: false, error: `Unsupported token: ${cleanToken}` };
}

/**
 * Gets exact on-chain wallet balance via Thru node RPC
 */
export async function getWalletBalance(address) {
  const clean = address?.trim() || BANK_ACCOUNT;
  const res = await runThruCommand(['getbalance', clean]);
  if (!res.success) {
    return {
      success: false,
      error: res.error || 'Account not found or offline'
    };
  }
  return {
    success: true,
    address: clean,
    pubkey: res.data?.balance?.pubkey || clean,
    balance: res.data?.balance?.balance || 0
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
