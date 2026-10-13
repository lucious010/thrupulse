export const RESERVES = {
  THRU: 3317002,
  tSOL: 100000,
  tUSD: 10000000,
  tETH: 2500,
  tBTC: 250
};

export function deductReserve(token, amount) {
  const t = token || 'THRU';
  if (RESERVES[t] !== undefined) {
    RESERVES[t] = Number(Math.max(0, RESERVES[t] - Number(amount)).toFixed(6));
  }
  return RESERVES;
}
