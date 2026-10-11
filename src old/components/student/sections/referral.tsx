"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
export default function ReferralSection() {
  const { setNotice } = useDashboard();

  return (
    <section className="sd-panel sd-referral">
      <span className="sd-icon amber">
        <Gift />
      </span>
      <h2>একসাথে প্রস্তুতি, একসাথে এগিয়ে চলা</h2>
      <p>বন্ধুদের সঙ্গে আপনার ডেমো রেফারেল কোড শেয়ার করুন।</p>
      <div className="sd-referral-code">
        AAROHON-DEMO{" "}
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText("AAROHON-DEMO");
              setNotice("কোড কপি হয়েছে।");
            } catch {
              setNotice(
                "কপি করা যায়নি। AAROHON-DEMO কোডটি নির্বাচন করে কপি করুন।",
              );
            }
          }}
        >
          কপি করুন
        </Button>
      </div>
      <div className="sd-info">
        এটি কেবল UI ডেমো। রেফারেল ট্র্যাকিং, পুরস্কার বা অর্থ লেনদেন এখন চালু
        নেই।
      </div>
    </section>
  );
}
