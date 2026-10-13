export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate');
  return res.status(200).json({
    status: 'online',
    bankAccount: 'default',
    pubkey: 'taCommunityTreasuryBetaNetVault111111111111',
    balance: 177907,
    reserves: {
      THRU: 177907,
      tSOL: 25000,
      tUSD: 1500000,
      tETH: 500,
      tBTC: 50
    },
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
