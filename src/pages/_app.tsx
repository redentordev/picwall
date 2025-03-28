import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

export default function App({ Component, pageProps }: AppProps) {
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
