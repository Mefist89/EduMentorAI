import type { Metadata } from "next";
import { PublicLanding } from "@/components/public-landing";

export const metadata: Metadata = {
  title: "EduMentor AI · Învățăm împreună",
  description:
    "Descoperă EduMentor: învățare, mentor AI, trasee de formare și comunitate. Explorează resurse educaționale publice din Republica Moldova.",
};

export default function AboutPage() {
  return <PublicLanding />;
}
