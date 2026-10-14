"use client";
import { useState } from "react";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/student/account-actions";
import { Check, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { bn } from "../navigation";
const genders = [
  ["male", "পুরুষ"],
  ["female", "নারী"],
  ["other", "অন্যান্য"],
] as const;
const levels = [
  ["ssc", "এসএসসি / সমমান"],
  ["hsc", "এইচএসসি / সমমান"],
  ["diploma", "ডিপ্লোমা"],
  ["honours", "স্নাতক / অনার্স"],
  ["masters", "স্নাতকোত্তর"],
  ["other", "অন্যান্য"],
] as const;
const detailKeys = [
  "phone",
  "dateOfBirth",
  "gender",
  "institution",
  "educationLevel",
  "district",
  "address",
] as const;
const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
// Latest allowed birth date (8 years ago), matching the database check.
const maxBirthDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 8);
  return d.toISOString().slice(0, 10);
};
export default function ProfileSection() {
  const { saved, ready, run } = useDashboard();
  const profile = saved.profile;
  // Details exist once 020_profile_details.sql has run.
  const detailed = profile.phone !== undefined;
  const filled = [
    profile.name,
    profile.goal,
    ...detailKeys.map((k) => profile[k]),
  ].filter(Boolean).length;
  const percent = Math.round((filled / (detailKeys.length + 2)) * 100);

  return (
    <div className="sd-profile-grid">
      <form
        className="sd-panel sd-profile"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const payload: Record<string, string> = {
            name: text(form, "name"),
            goal: text(form, "goal"),
          };
          if (detailed)
            for (const key of detailKeys) payload[key] = text(form, key);
          void run("profile", payload);
        }}
        // Reset fields to the saved values after each successful save.
        key={JSON.stringify(profile)}
      >
        <div className="sd-profile-heading">
          <span className="sd-avatar">
            <UserRound />
          </span>
          <div>
            <h2>আপনার পরিচিতি</h2>
            <p>{profile.email}</p>
          </div>
        </div>
        {detailed && (
          <div className="sd-profile-progress">
            <div>
              <span>প্রোফাইল সম্পূর্ণ</span>
              <b>{bn(percent)}%</b>
            </div>
            <span>
              <i style={{ width: `${percent}%` }} />
            </span>
          </div>
        )}
        <fieldset className="sd-profile-fields">
          <legend>ব্যক্তিগত তথ্য</legend>
          <div className="sd-field sd-field-wide">
            <Label htmlFor="student-name">পূর্ণ নাম *</Label>
            <Input
              id="student-name"
              name="name"
              maxLength={80}
              defaultValue={profile.name}
              autoComplete="name"
              required
            />
          </div>
          <div className="sd-field">
            <Label htmlFor="student-email">ইমেইল</Label>
            <Input
              id="student-email"
              readOnly
              type="email"
              defaultValue={profile.email}
            />
          </div>
          {detailed && (
            <>
              <div className="sd-field">
                <Label htmlFor="student-phone">মোবাইল নম্বর</Label>
                <Input
                  id="student-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  maxLength={20}
                  defaultValue={profile.phone}
                  autoComplete="tel"
                />
              </div>
              <div className="sd-field">
                <Label htmlFor="student-dob">জন্মতারিখ</Label>
                <Input
                  id="student-dob"
                  name="dateOfBirth"
                  type="date"
                  min="1940-01-01"
                  max={maxBirthDate()}
                  defaultValue={profile.dateOfBirth}
                  autoComplete="bday"
                />
              </div>
              <div className="sd-field">
                <Label htmlFor="student-gender">লিঙ্গ</Label>
                <select
                  id="student-gender"
                  name="gender"
                  className="sd-select"
                  defaultValue={profile.gender}
                >
                  <option value="">নির্বাচন করুন</option>
                  {genders.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </fieldset>
        {detailed && (
          <fieldset className="sd-profile-fields">
            <legend>শিক্ষা ও ঠিকানা</legend>
            <div className="sd-field sd-field-wide">
              <Label htmlFor="student-institution">শিক্ষাপ্রতিষ্ঠান</Label>
              <Input
                id="student-institution"
                name="institution"
                maxLength={150}
                placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়"
                defaultValue={profile.institution}
                autoComplete="organization"
              />
            </div>
            <div className="sd-field">
              <Label htmlFor="student-level">শিক্ষাগত যোগ্যতা</Label>
              <select
                id="student-level"
                name="educationLevel"
                className="sd-select"
                defaultValue={profile.educationLevel}
              >
                <option value="">নির্বাচন করুন</option>
                {levels.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sd-field">
              <Label htmlFor="student-district">জেলা</Label>
              <Input
                id="student-district"
                name="district"
                maxLength={60}
                placeholder="যেমন: ঢাকা"
                defaultValue={profile.district}
                autoComplete="address-level2"
              />
            </div>
            <div className="sd-field sd-field-wide">
              <Label htmlFor="student-address">ঠিকানা</Label>
              <textarea
                id="student-address"
                name="address"
                className="sd-textarea"
                rows={3}
                maxLength={300}
                defaultValue={profile.address}
                autoComplete="street-address"
              />
            </div>
          </fieldset>
        )}
        <fieldset className="sd-profile-fields">
          <legend>প্রস্তুতি</legend>
          <div className="sd-field sd-field-wide">
            <Label htmlFor="student-goal">আপনার লক্ষ্য</Label>
            <Input
              id="student-goal"
              name="goal"
              maxLength={120}
              placeholder="যেমন: ৪৭তম বিসিএস"
              defaultValue={profile.goal}
            />
          </div>
        </fieldset>
        <p>
          আপনার তথ্য শুধু আপনার অ্যাকাউন্ট ও একাডেমির প্রশাসনের জন্য সংরক্ষিত
          থাকে।
        </p>
        <Button disabled={!ready} type="submit">
          পরিবর্তন সংরক্ষণ করুন <Check />
        </Button>
      </form>
      <PasswordForm hasPassword={profile.hasPassword !== false} />
    </div>
  );
}
function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ error?: string; message?: string }>(
    {},
  );
  // Becomes true after a Google-only account sets its first password.
  const [hasOwn, setHasOwn] = useState(hasPassword);
  const type = show ? "text" : "password";
  return (
    <form
      className="sd-panel sd-profile sd-password"
      onSubmit={async (e) => {
        e.preventDefault();
        const formElement = e.currentTarget;
        const form = new FormData(formElement);
        const next = String(form.get("next") ?? "");
        if (next !== String(form.get("confirm") ?? "")) {
          setStatus({ error: "নতুন পাসওয়ার্ড দুটি মেলেনি।" });
          return;
        }
        setBusy(true);
        setStatus({});
        const result = await changePassword(
          String(form.get("current") ?? ""),
          next,
        );
        setBusy(false);
        setStatus(result);
        if (!result.error) {
          formElement.reset();
          setHasOwn(true);
        }
      }}
    >
      <div className="sd-profile-heading">
        <span className="sd-avatar">
          <KeyRound />
        </span>
        <div>
          <h2>{hasOwn ? "পাসওয়ার্ড পরিবর্তন" : "পাসওয়ার্ড সেট করুন"}</h2>
          <p>
            {hasOwn
              ? "পরিবর্তনের পর অন্য সব ডিভাইস থেকে লগআউট হয়ে যাবে।"
              : "আপনি Google দিয়ে লগইন করেছেন। পাসওয়ার্ড সেট করলে ইমেইল দিয়েও লগইন করতে পারবেন।"}
          </p>
        </div>
      </div>
      {hasOwn && (
        <div className="sd-field">
          <Label htmlFor="current-password">বর্তমান পাসওয়ার্ড</Label>
          <Input
            id="current-password"
            name="current"
            type={type}
            autoComplete="current-password"
            required
          />
        </div>
      )}
      <div className="sd-field">
        <Label htmlFor="new-password">নতুন পাসওয়ার্ড</Label>
        <Input
          id="new-password"
          name="next"
          type={type}
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="sd-field">
        <Label htmlFor="confirm-password">নতুন পাসওয়ার্ড আবার লিখুন</Label>
        <Input
          id="confirm-password"
          name="confirm"
          type={type}
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          required
        />
      </div>
      <button
        type="button"
        className="sd-password-toggle"
        onClick={() => setShow((value) => !value)}
      >
        {show ? <EyeOff /> : <Eye />}
        {show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
      </button>
      <p>কমপক্ষে ৮ অক্ষর। অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে দিলে বেশি নিরাপদ।</p>
      {(status.error || status.message) && (
        <div
          className={status.error ? "sd-form-error" : "sd-form-success"}
          role={status.error ? "alert" : "status"}
        >
          {status.error ?? status.message}
        </div>
      )}
      <Button disabled={busy} type="submit">
        {busy
          ? "সংরক্ষণ হচ্ছে…"
          : hasOwn
            ? "পাসওয়ার্ড পরিবর্তন করুন"
            : "পাসওয়ার্ড সেট করুন"}
        <KeyRound />
      </Button>
    </form>
  );
}
