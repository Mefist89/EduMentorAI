import { MentorApp } from "@/components/mentor-app";
import { getAccount } from "@/lib/auth";
import { PublicLanding } from "@/components/public-landing";

export const metadata = {
  title: "EduMentor AI · Învățăm împreună",
  description:
    "Descoperă platforma EduMentor: materiale de învățare, mentor AI, trasee de formare, comunitate și resurse educaționale publice.",
};

export default async function Home() {
  const account = await getAccount();
  if (!account) return <PublicLanding />;
  return <MentorApp account={account} />;
}
