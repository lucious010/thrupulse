import { deductReserve } from './_reserves.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { address, amount, token } = req.body || {};
  const cleanRecipient = address?.trim();
  const cleanToken = (token || 'THRU').trim();

  if (!cleanRecipient) {
    return res.status(400).json({ success: false, error: 'Recipient address is required.' });
  }

  const numAmount = Number(amount) || 100;
  const updatedReserves = deductReserve(cleanToken, numAmount);
  const sig = `tx_thruvm_betanet_${cleanRecipient.slice(0, 8)}_${Math.random().toString(36).substring(2, 12)}`;

  return res.status(200).json({
    success: true,
    recipient: cleanRecipient,
    amount: numAmount,
    token: cleanToken,
    signature: sig,
    slot: Math.floor(1000000 + Math.random() * 50000),
    source: 'treasury-vault',
    reserves: updatedReserves
  });
}
