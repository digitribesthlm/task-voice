import crypto from 'crypto';
import { serialize, parse } from 'cookie';

const COOKIE_NAME = 'task_voice_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const SESSION_TTL_MS = COOKIE_MAX_AGE_SECONDS * 1000;

const AUTH_IDENTIFIER = (process.env.USERNAME || '').trim();
const AUTH_PASSWORD = process.env.PASSWORD || '';
const AUTH_SECRET =
  process.env.SECRET ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  'task_voice_fallback_secret';

if (!AUTH_IDENTIFIER || !AUTH_PASSWORD) {
  throw new Error(
    'Missing USERNAME or PASSWORD in .env.local (lines 4-6). Please define USERNAME, PASSWORD, and SECRET for the login form.'
  );
}

function createSignature(payload) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
}

function constantTimeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function encodeToken(email) {
  const timestamp = Date.now().toString();
  const payload = `${email}:${timestamp}`;
  const signature = createSignature(payload);
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function decodeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [email, timestamp, signature] = decoded.split(':');
    if (!email || !timestamp || !signature) {
      return null;
    }
    const payload = `${email}:${timestamp}`;
    const expectedSignature = createSignature(payload);
    if (!constantTimeCompare(signature, expectedSignature)) {
      return null;
    }
    if (Date.now() - Number(timestamp) > SESSION_TTL_MS) {
      return null;
    }
    return { email };
  } catch (error) {
    return null;
  }
}

export function credentialsAreValid(identifier, password) {
  const normalizedInput = (identifier || '').trim().toLowerCase();
  const normalizedStored = AUTH_IDENTIFIER.toLowerCase();
  return normalizedInput === normalizedStored && password === AUTH_PASSWORD;
}

export function setSessionCookie(res, email) {
  const token = encodeToken(email);
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function isRequestAuthenticated(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return false;
  }
  const session = decodeToken(token);
  return Boolean(session);
}

export function getAuthenticatedEmail(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return null;
  }
  const session = decodeToken(token);
  return session?.email ?? null;
}

