/** PKCS#12 SPA identity. Matches Swing `KSE.Name` / `KSE.Version`. */
export const APP_NAME = "KeyStore Explorer";
export const APP_VERSION = "5.7.0";

export const ABOUT_LICENSE =
  "See help for details of the end user license agreement.";

export const ABOUT_TICKER = [
  "Copyright 2004 - 2013 Wayne Grant, 2013 - 2026 Kai Kramer",
  "Bouncy Castle JCE Provider Copyright 2000 - 2021 The Legion Of The Bouncy Castle (www.bouncycastle.org)",
  "Apache Commons Copyright 2002 - 2021 The Apache Software Foundation (commons.apache.org)",
  "MigLayout Copyright 2004, Mikael Grev, MiG InfoCom AB (www.miglayout.com)",
  "Fugue Icons Copyright 2013 Yusuke Kamiyamane (p.yusukekamiyamane.com)",
  "FlatLaf Copyright 2019 - 2021 FormDev Software GmbH (www.formdev.com/flatlaf/)",
  "Nimbus JOSE + JWT Copyright 2012 - 2022, Connect2id Ltd. (connect2id.com)",
  "Diff Utils library Copyright 2009-2022 java-diff-utils (github.com/java-diff-utils)",
];

export interface JarRow {
  file: string;
  size: string;
  specTitle: string;
  specVersion: string;
  specVendor: string;
  implTitle: string;
  implVersion: string;
  implVendor: string;
}

export const JAR_COLUMNS = [
  "JAR File",
  "Size",
  "Specification Title",
  "Specification Version",
  "Specification Vendor",
  "Implementation Title",
  "Implementation Version",
  "Implementation Vendor",
] as const;

/** Browser PKCS#12 stack in the Swing JAR-info table shape. */
export const JAR_ROWS: JarRow[] = [
  {
    file: "pkijs",
    size: "—",
    specTitle: "PKI.js",
    specVersion: "3",
    specVendor: "Peculiar Ventures",
    implTitle: "pkijs",
    implVersion: "3.4.0",
    implVendor: "Peculiar Ventures",
  },
  {
    file: "asn1js",
    size: "—",
    specTitle: "ASN.1",
    specVersion: "3",
    specVendor: "Peculiar Ventures",
    implTitle: "asn1js",
    implVersion: "3.0.10",
    implVendor: "Peculiar Ventures",
  },
  {
    file: "pvutils",
    size: "—",
    specTitle: "pvutils",
    specVersion: "1",
    specVendor: "Peculiar Ventures",
    implTitle: "pvutils",
    implVersion: "1.2.0",
    implVendor: "Peculiar Ventures",
  },
  {
    file: "@peculiar/webcrypto",
    size: "—",
    specTitle: "Web Cryptography API",
    specVersion: "1",
    specVendor: "W3C",
    implTitle: "@peculiar/webcrypto",
    implVersion: "1.7.1",
    implVendor: "Peculiar Ventures",
  },
  {
    file: "react",
    size: "—",
    specTitle: "React",
    specVersion: "19",
    specVendor: "Meta",
    implTitle: "react",
    implVersion: "19.2.8",
    implVendor: "Meta",
  },
];

export interface ProviderService {
  name: string;
  algorithms: string[];
}

export interface SecurityProvider {
  title: string;
  info: string;
  impl: string;
  services: ProviderService[];
}

export const SECURITY_PROVIDERS: SecurityProvider[] = [
  {
    title: "WebCrypto v1.0",
    info: "W3C SubtleCrypto (browser PKCS#12 SPA)",
    impl: "SubtleCrypto",
    services: [
      { name: "Key Pair Generators", algorithms: ["RSA"] },
      { name: "Key Stores", algorithms: ["PKCS12"] },
      { name: "Message Digests", algorithms: ["SHA-256", "SHA-384", "SHA-512"] },
      { name: "Signatures", algorithms: ["RSASSA-PKCS1-v1_5", "RSA-PSS"] },
      { name: "Ciphers", algorithms: ["AES-GCM", "AES-CBC"] },
      { name: "Secret Key Factories", algorithms: ["AES"] },
    ],
  },
  {
    title: "PKI.js v3.4",
    info: "PKCS#12 parse and write for the in-browser kernel",
    impl: "pkijs",
    services: [
      { name: "Certificate Factories", algorithms: ["X.509"] },
      { name: "Key Stores", algorithms: ["PKCS12"] },
      { name: "Key Factories", algorithms: ["PKCS#8"] },
    ],
  },
];

export interface SystemField {
  label: string;
  value: string;
}

function memoryKb(bytes: number | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return "Unknown";
  }
  return `${Math.round(bytes / 1024)} kB`;
}

export function systemFields(): SystemField[] {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  const loc = typeof location === "undefined" ? undefined : location;
  const heap =
    typeof performance === "undefined"
      ? undefined
      : (
          performance as {
            memory?: {
              jsHeapSizeLimit?: number;
              totalJSHeapSize?: number;
              usedJSHeapSize?: number;
            };
          }
        ).memory;
  const free =
    heap?.totalJSHeapSize !== undefined && heap.usedJSHeapSize !== undefined
      ? heap.totalJSHeapSize - heap.usedJSHeapSize
      : undefined;

  return [
    { label: "Hostname:", value: loc?.hostname || "Unknown" },
    { label: "Operating System:", value: nav?.userAgent || "Unknown" },
    { label: "Default Locale:", value: nav?.language || "Unknown" },
    { label: "Java Version:", value: nav?.userAgent || "Unknown" },
    {
      label: "Java Vendor:",
      value: nav?.vendor ? `${nav.vendor} (${loc?.origin ?? ""})` : "Unknown",
    },
    { label: "Java Home:", value: loc?.origin || "Unknown" },
    { label: "JVM Maximum Memory:", value: memoryKb(heap?.jsHeapSizeLimit) },
    { label: "JVM Total Memory:", value: memoryKb(heap?.totalJSHeapSize) },
    { label: "JVM Free Memory:", value: memoryKb(free) },
    {
      label: "Available Processors:",
      value: nav?.hardwareConcurrency?.toString() || "Unknown",
    },
  ];
}
