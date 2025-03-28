import PrivacyPolicy from "@/components/picwall/privacy-policy-page";
import { NextSeo } from "next-seo";

export default function Privacy() {
  return (
    <>
      <NextSeo
        title="Picwall - Privacy Policy"
        description="Privacy Policy for Picwall"
      />
      <PrivacyPolicy />
    </>
  );
}
