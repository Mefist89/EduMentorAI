import { MentorApp } from "@/components/mentor-app";
import { getAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const account = await getAccount();
  if (!account) redirect("/login");
  return <MentorApp account={account} />;
}
