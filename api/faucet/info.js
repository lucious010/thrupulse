import { RESERVES } from './_reserves.js';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({
    status: 'online',
    bankAccount: 'default',
    pubkey: 'taCommunityTreasuryBetaNetVault111111111111',
    balance: RESERVES.THRU,
    reserves: { ...RESERVES },
    dispenseAmounts: {
      THRU: 100,
      tSOL: 5,
      tUSD: 250,
      tETH: 0.5,
      tBTC: 0.05
    },
    cooldownMinutes: 3
  });
}
