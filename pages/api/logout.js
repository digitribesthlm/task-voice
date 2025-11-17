import { clearSessionCookie } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  clearSessionCookie(res);
  return res.status(200).json({ message: 'Logged out successfully.' });
}

