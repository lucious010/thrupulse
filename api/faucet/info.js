import { RESERVES } from './_reserves.js';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({
    status: 'online',
    bankAccount: 'default',
    pubkey: 'taMcFOLfiSVdjeWZPGR5vNbbLbHWxrF409XUxNVjiMfmMj',
    balance: RESERVES.THRU,
    reserves: { ...RESERVES },
    dispenseAmounts: {
      THRU: 1000,
      tSOL: 25,
      tUSD: 1000,
      tETH: 0.5,
      tBTC: 0.1
    },
    cooldownMinutes: 3
  });
}
