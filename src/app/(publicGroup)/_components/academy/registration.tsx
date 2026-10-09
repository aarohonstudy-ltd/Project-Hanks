'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerDemo } from '@/lib/academy/demo-session';
export default function Registration({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
 const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError('');
  try { await registerDemo({ name: String(form.get('name') ?? ''), email: String(form.get('email') ?? '') }); onOpenChange(false); router.push('/free-exam'); }
  catch (e) { setError(e instanceof Error ? e.message : 'আবার চেষ্টা করুন।'); }
  finally { setBusy(false); }
 }
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="academy-home rounded-2xl" lang="bn"><DialogHeader><DialogTitle>ফ্রি পরীক্ষার জন্য রেজিস্ট্রেশন</DialogTitle><DialogDescription>ডেমো ফ্লো—বাস্তব অ্যাকাউন্ট তৈরি হবে না। নাম ও ইমেইল সংরক্ষণ করা হবে না।</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="demo-name">নাম</Label><Input id="demo-name" name="name" required maxLength={80} autoComplete="name" /></div><div className="space-y-2"><Label htmlFor="demo-email">ইমেইল</Label><Input id="demo-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}<Button disabled={busy} className="academy-primary academy-action w-full rounded-full">{busy ? 'অপেক্ষা করুন…' : 'রেজিস্ট্রেশন করে পরীক্ষা দিন'}</Button></form></DialogContent></Dialog>;
}
