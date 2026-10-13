import crypto from 'node:crypto';

export default function handler(req, res) {
  const randSuffix = Math.random().toString(36).substring(2, 8);
  const name = `user_${Date.now()}_${randSuffix}`;

  const privateKeyHex = crypto.randomBytes(32).toString('hex');
  const rawPub = crypto.createHash('sha256').update(Buffer.from(privateKeyHex, 'hex')).digest();
  const b64url = rawPub.toString('base64url');
  const checkByte = rawPub.reduce((acc, b) => (acc ^ b), 0x5a);
  const checkChar = Buffer.from([checkByte]).toString('base64url').slice(0, 1) || 'z';
  const pubkey = `ta${b64url}${checkChar}`;

  return res.status(200).json({
    success: true,
    name,
    pubkey,
    privateKeyHex
  });
}
