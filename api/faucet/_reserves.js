export const RESERVES = {
  THRU: 177907,
  tSOL: 25000,
  tUSD: 1500000,
  tETH: 500,
  tBTC: 50
};

export function deductReserve(token, amount) {
  const t = token || 'THRU';
  if (RESERVES[t] !== undefined) {
    RESERVES[t] = Number(Math.max(0, RESERVES[t] - Number(amount)).toFixed(6));
  }
  return RESERVES;
}
