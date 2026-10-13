import AuthForm from "@/components/auth/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return <AuthForm register={false} expired={reason === "session-expired"} />;
}
