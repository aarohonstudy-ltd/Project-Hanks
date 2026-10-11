"use client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export default function Registration({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>আরোহণে যোগ দিন</DialogTitle>
          <DialogDescription>
            আপনার অ্যাকাউন্ট দিয়ে প্রস্তুতি শুরু করুন।
          </DialogDescription>
        </DialogHeader>
        <Link href="/register">নতুন অ্যাকাউন্ট তৈরি করুন</Link>
        <Link href="/login">লগইন করুন</Link>
      </DialogContent>
    </Dialog>
  );
}
