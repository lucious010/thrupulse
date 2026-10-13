export default function handler(req, res) {
  const address = req.query?.address || 'default';
  return res.status(200).json({
    success: true,
    address,
    pubkey: address,
    balance: 0
  });
}
