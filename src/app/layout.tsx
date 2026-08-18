import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { connectDB } from "@/lib/db";
import { parseHtmlTags } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic By Choice - Premier Healthcare & Medical Tourism Platform in India",
  description: "Find top accredited hospitals, clinics, and verified medical specialists across India. Compare packages, book consultations, and access premium medical care.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/images/logoblac.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/images/logoblac.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let headerScript = '';
  let footerScript = '';
  let googleAnalyticsId = '';
  let googleTagManagerId = '';
  let globalSchema = '';

  try {
    const db = await connectDB();
    if (db) {
      const { Setting } = await import('@/models/Setting');
      const headerObj = await Setting.findOne({ where: { key: 'header_script' } });
      const footerObj = await Setting.findOne({ where: { key: 'footer_script' } });
      const gaObj = await Setting.findOne({ where: { key: 'google_analytics_id' } });
      const gtmObj = await Setting.findOne({ where: { key: 'google_tag_manager_id' } });
      const schemaObj = await Setting.findOne({ where: { key: 'global_schema' } });

      if (headerObj) headerScript = headerObj.value || '';
      if (footerObj) footerScript = footerObj.value || '';
      if (gaObj) googleAnalyticsId = gaObj.value || '';
      if (gtmObj) googleTagManagerId = gtmObj.value || '';
      if (schemaObj) globalSchema = schemaObj.value || '';
    }
  } catch (err) {
    console.error('Error fetching global scripts:', err);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logoblac.png" />
        
        {/* Google Tag Manager (Head) */}
        {googleTagManagerId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${googleTagManagerId}');
              `,
            }}
          />
        )}

        {/* Google Analytics Tag */}
        {googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${googleAnalyticsId}');
                `,
              }}
            />
          </>
        )}

        {/* Global Schema Markup (if raw JSON-LD) */}
        {globalSchema && !globalSchema.includes('<script') && (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: globalSchema }}
          />
        )}
        {headerScript && parseHtmlTags(headerScript)}
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (Noscript) */}
        {googleTagManagerId && (
          <noscript
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        )}

        {/* Global Schema Markup (if HTML string) */}
        {globalSchema && globalSchema.includes('<script') && (
          <div
            style={{ display: 'none' }}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: globalSchema }}
          />
        )}

        {children}

        {/* Footer Inject Scripts */}
        {footerScript && (
          <div
            style={{ display: 'none' }}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: footerScript }}
          />
        )}
      </body>
    </html>
  );
}
