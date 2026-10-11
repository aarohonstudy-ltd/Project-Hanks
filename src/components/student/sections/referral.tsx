"use client";
import { useDashboard } from "../dashboard-context";
import { Button } from "@/components/ui/button";
export default function ReferralSection() {
  const { data, run, ready, setNotice } = useDashboard();
  return (
    <section className="sd-panel sd-referral">
      <h2>আপনার রেফারেল কোড</h2>
      <p>{data.referralCode || "কোড তৈরি করুন।"}</p>
      {data.referralCode ? (
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(data.referralCode!);
              setNotice("কোড কপি হয়েছে।");
            } catch {
              setNotice("কোডটি নির্বাচন করে কপি করুন।");
            }
          }}
        >
          কপি করুন
        </Button>
      ) : (
        <Button disabled={!ready} onClick={() => run("referral_code")}>
          কোড তৈরি করুন
        </Button>
      )}
      <p>সংরক্ষিত রেফারেল: {data.referralCount ?? 0}</p>
      <p>সাইনআপে রেফারেল গ্রহণ ও স্বয়ংক্রিয় পুরস্কার এখনো চালু হয়নি।</p>
    </section>
  );
}
