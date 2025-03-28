import LoginPage from "@/components/picwall/login-page";
import { NextSeo } from "next-seo";

export default function Login() {
  return (
    <>
      <NextSeo
        title="Picwall - Login"
        description="Login to your Picwall account"
        openGraph={{
          type: "website",
          url: "https://picwall.redentor.dev/login",
          title: "Picwall - Login",
          description: "Login to your Picwall account",
        }}
      />
      <LoginPage />
    </>
  );
}
