'use client';
const KEY = 'academy-demo-registered';
// UI simulation only. No password, email or name is persisted. NOT authentication.
export function hasDemoRegistration() { try { return sessionStorage.getItem(KEY) === 'yes'; } catch { return false; } }
export async function registerDemo(input: { name: string; email: string }) {
 if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error('সঠিক নাম ও ইমেইল দিন।');
 // BACKEND: POST /auth/register; validate on server, hash passwords if used,
 // set an HttpOnly session cookie, then return success. Never trust this demo flag.
 try { sessionStorage.setItem(KEY, 'yes'); } catch { throw new Error('এই ব্রাউজারে session storage চালু করুন।'); }
}
