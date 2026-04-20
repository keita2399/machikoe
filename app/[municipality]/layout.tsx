import Script from "next/script";
import { getMunicipality } from "@/lib/municipalities";

export default async function MunicipalityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ municipality: string }>;
}) {
  const { municipality } = await params;
  const mc = getMunicipality(municipality);
  const gaId = mc?.gaId;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id={`ga-${municipality}`} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
      {children}
    </>
  );
}
