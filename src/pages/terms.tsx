import TermsOfService from "@/components/picwall/terms-page";
import { NextSeo } from "next-seo";

export default function Terms() {
  return (
    <>
      <NextSeo
        title="Picwall - Terms of Service"
        description="Terms of Service for Picwall"
      />
      <TermsOfService />
    </>
  );
}
