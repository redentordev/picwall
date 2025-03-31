import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          registration => {
            console.log(
              "Service Worker registration successful with scope: ",
              registration.scope
            );
          },
          err => {
            console.log("Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DefaultSeo
        openGraph={{
          type: "website",
          locale: "en_IE",
          url: "https://picwall.redentor.dev/",
          siteName: "Picwall",
        }}
        twitter={{
          handle: "@redentor_dev",
          site: "@redentor_dev",
          cardType: "summary_large_image",
        }}
      />
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}
