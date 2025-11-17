import { credentialsAreValid, setSessionCookie } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { email, username, identifier, password } = req.body || {};
  const loginIdentifier = (identifier || email || username || '').trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required.' });
  }

  if (!credentialsAreValid(loginIdentifier, password)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  setSessionCookie(res, loginIdentifier);
  return res.status(200).json({ message: 'Login successful.' });
}

