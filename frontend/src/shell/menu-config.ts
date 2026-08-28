import type { MenuDef, MenuItemDef } from "./types";

export const KEYSTORE_TYPES = [
  { id: "dialog.new-keystore.type.pkcs12", label: "PKCS#12", value: "PKCS12", stub: false },
  { id: "dialog.new-keystore.type.jceks", label: "JCEKS", value: "JCEKS", stub: true },
  { id: "dialog.new-keystore.type.jks", label: "JKS", value: "JKS", stub: true },
  { id: "dialog.new-keystore.type.bks", label: "BKS", value: "BKS", stub: true },
  { id: "dialog.new-keystore.type.uber", label: "UBER", value: "UBER", stub: true },
  { id: "dialog.new-keystore.type.bcfks", label: "BCFKS", value: "BCFKS", stub: true },
  { id: "dialog.new-keystore.type.pem", label: "PEM", value: "PEM", stub: true },
  { id: "dialog.new-keystore.type.kdb", label: "KDB", value: "KDB", stub: true },
] as const;

const CHANGE_TYPE_ITEMS: MenuItemDef[] = [
  { id: "menu.tools.change-type.pkcs12", label: "PKCS#12", command: "changeType" },
  { id: "menu.tools.change-type.jceks", label: "JCEKS", stub: true },
  { id: "menu.tools.change-type.jks", label: "JKS", stub: true },
  { id: "menu.tools.change-type.bks", label: "BKS", stub: true },
  { id: "menu.tools.change-type.uber", label: "UBER", stub: true },
  { id: "menu.tools.change-type.bcfks", label: "BCFKS", stub: true },
  { id: "menu.tools.change-type.pem", label: "PEM", stub: true },
  { id: "menu.tools.change-type.kdb", label: "KDB", stub: true },
];

const CONTEXT_CHANGE_TYPE: MenuItemDef[] = CHANGE_TYPE_ITEMS.map((item) => ({
  ...item,
  id: item.id.replace("menu.tools.change-type", "context.keystore.change-type"),
}));

export const MENUS: MenuDef[] = [
  {
    id: "menu.file",
    label: "File",
    items: [
      { id: "menu.file.new", label: "New", command: "newKeyStore" },
      { id: "menu.file.open", label: "Open", command: "openKeyStore" },
      {
        id: "menu.file.open-special",
        label: "Open Special",
        submenu: [
          {
            id: "menu.file.open-special.ca-certificates",
            label: "CA Certificates",
            command: "openCaCertificates",
          },
          { id: "menu.file.open-special.default", label: "Default KeyStore", stub: true },
          { id: "menu.file.open-special.pkcs11", label: "PKCS#11", stub: true },
          { id: "menu.file.open-special.windows-my", label: "Windows-MY", stub: true },
          { id: "menu.file.open-special.windows-root", label: "Windows-ROOT", stub: true },
          { id: "menu.file.open-special.apple-keychain", label: "Apple Keychain", stub: true },
        ],
      },
      { id: "menu.file.reload", label: "Reload", command: "reloadKeyStore" },
      { id: "menu.file.close", label: "Close", command: "closeKeyStore", separatorBefore: true },
      { id: "menu.file.close-all", label: "Close All", command: "closeAllKeyStores" },
      { id: "menu.file.save", label: "Save", command: "saveKeyStore", separatorBefore: true },
      { id: "menu.file.save-as", label: "Save As", command: "saveKeyStoreAs" },
      { id: "menu.file.save-all", label: "Save All", command: "saveAllKeyStores" },
      { id: "menu.file.recent-files", label: "Recent Files", submenu: [] },
      { id: "menu.file.exit", label: "Exit", command: "exitApp", separatorBefore: true },
    ],
  },
  {
    id: "menu.edit",
    label: "Edit",
    items: [
      { id: "menu.edit.undo", label: "Undo", command: "undo" },
      { id: "menu.edit.redo", label: "Redo", command: "redo" },
      { id: "menu.edit.cut", label: "Cut", command: "cut", separatorBefore: true },
      { id: "menu.edit.copy", label: "Copy", command: "copy" },
      { id: "menu.edit.paste", label: "Paste", command: "paste" },
      { id: "menu.edit.find", label: "Find", command: "find", separatorBefore: true },
      { id: "menu.edit.compare", label: "Compare Certificates", command: "compareCertificate" },
    ],
  },
  {
    id: "menu.view",
    label: "View",
    items: [
      { id: "menu.view.tool-bar", label: "Tool Bar", stub: true },
      { id: "menu.view.status-bar", label: "Status Bar", stub: true },
      {
        id: "menu.view.tab-style",
        label: "Tab Style",
        stub: true,
        submenu: [
          { id: "menu.view.tab-style.wrap", label: "Wrap", stub: true },
          { id: "menu.view.tab-style.scroll", label: "Scroll", stub: true },
        ],
      },
    ],
  },
  {
    id: "menu.tools",
    label: "Tools",
    items: [
      { id: "menu.tools.generate-key-pair", label: "Generate Key Pair", command: "generateKeyPair" },
      { id: "menu.tools.generate-secret-key", label: "Generate Secret Key", command: "generateSecretKey" },
      {
        id: "menu.tools.generate-dh-parameters",
        label: "Generate DH Parameters",
        command: "generateDhParameters",
      },
      {
        id: "menu.tools.import-trusted-certificate",
        label: "Import Trusted Certificate",
        command: "importTrustedCertificate",
        separatorBefore: true,
      },
      { id: "menu.tools.import-key-pair", label: "Import Key Pair", command: "importKeyPair" },
      { id: "menu.tools.store-passphrase", label: "Store Passphrase", command: "storePassphrase" },
      {
        id: "menu.tools.verify-signature",
        label: "Verify Signature",
        command: "verifySignature",
        separatorBefore: true,
      },
      { id: "menu.tools.verify-jar", label: "Verify JAR", command: "verifyJar" },
      {
        id: "menu.tools.set-password",
        label: "Set KeyStore Password",
        command: "setPassword",
        separatorBefore: true,
      },
      {
        id: "menu.tools.change-type",
        label: "Change KeyStore Type",
        command: "changeType",
        submenu: CHANGE_TYPE_ITEMS,
      },
      { id: "menu.tools.properties", label: "Properties", command: "properties" },
      { id: "menu.tools.export-csv", label: "Export KeyStore as CSV", command: "exportCsv" },
      { id: "menu.tools.preferences", label: "Preferences", stub: true, separatorBefore: true },
    ],
  },
  {
    id: "menu.examine",
    label: "Examine",
    items: [
      { id: "menu.examine.file", label: "Examine File", command: "examineFile" },
      { id: "menu.examine.clipboard", label: "Examine Clipboard", command: "examineClipboard" },
      { id: "menu.examine.ssl", label: "Examine SSL", command: "examineSsl" },
      { id: "menu.examine.detect-file-type", label: "Detect File Type", command: "detectFileType" },
    ],
  },
  {
    id: "menu.help",
    label: "Help",
    items: [
      { id: "menu.help.help", label: "Help", stub: true },
      { id: "menu.help.tip-of-the-day", label: "Tip of the Day", stub: true },
      {
        id: "menu.help.online-resources",
        label: "Online Resources",
        stub: true,
        submenu: [
          { id: "menu.help.online-resources.website", label: "Website", stub: true },
          { id: "menu.help.online-resources.github", label: "GitHub", stub: true },
          { id: "menu.help.online-resources.issue-tracker", label: "Issue Tracker", stub: true },
        ],
      },
      { id: "menu.help.check-update", label: "Check for Updates", command: "checkUpdate", separatorBefore: true },
      { id: "menu.help.security-providers", label: "Security Providers", command: "securityProviders" },
      { id: "menu.help.jars", label: "JARs", command: "jars" },
      { id: "menu.help.system-information", label: "System Information", command: "systemInformation" },
      { id: "menu.help.about", label: "About", command: "about", separatorBefore: true },
    ],
  },
];

export const TOOLBAR_GROUPS: MenuItemDef[][] = [
  [
    { id: "toolbar.new", label: "New", command: "newKeyStore" },
    { id: "toolbar.open", label: "Open", command: "openKeyStore" },
    { id: "toolbar.save", label: "Save", command: "saveKeyStore" },
  ],
  [
    { id: "toolbar.undo", label: "Undo", command: "undo" },
    { id: "toolbar.redo", label: "Redo", command: "redo" },
  ],
  [
    { id: "toolbar.cut", label: "Cut", command: "cut" },
    { id: "toolbar.copy", label: "Copy", command: "copy" },
    { id: "toolbar.paste", label: "Paste", command: "paste" },
  ],
  [
    { id: "toolbar.generate-key-pair", label: "Generate Key Pair", command: "generateKeyPair" },
    { id: "toolbar.generate-secret-key", label: "Generate Secret Key", command: "generateSecretKey" },
  ],
  [
    {
      id: "toolbar.import-trusted-certificate",
      label: "Import Trusted Certificate",
      command: "importTrustedCertificate",
    },
    { id: "toolbar.import-key-pair", label: "Import Key Pair", command: "importKeyPair" },
  ],
  [
    { id: "toolbar.verify-signature", label: "Verify Signature", command: "verifySignature" },
    { id: "toolbar.verify-jar", label: "Verify JAR", command: "verifyJar" },
  ],
  [
    { id: "toolbar.set-password", label: "Set KeyStore Password", command: "setPassword" },
    { id: "toolbar.properties", label: "Properties", command: "properties" },
  ],
  [{ id: "toolbar.export-csv", label: "Export CSV", command: "exportCsv" }],
  [
    { id: "toolbar.examine-file", label: "Examine File", command: "examineFile" },
    { id: "toolbar.examine-clipboard", label: "Examine Clipboard", command: "examineClipboard" },
    { id: "toolbar.examine-ssl", label: "Examine SSL", command: "examineSsl" },
  ],
  [{ id: "toolbar.help", label: "Help", stub: true }],
];

export const QUICKSTART_ITEMS: MenuItemDef[] = [
  { id: "quickstart.new", label: "New KeyStore", command: "newKeyStore" },
  { id: "quickstart.open", label: "Open KeyStore", command: "openKeyStore" },
  {
    id: "quickstart.open-ca-certificates",
    label: "Open CA Certificates",
    command: "openCaCertificates",
  },
  { id: "quickstart.examine-file", label: "Examine File", command: "examineFile" },
  { id: "quickstart.open-default", label: "Open Default KeyStore", stub: true },
  { id: "quickstart.help", label: "Help", stub: true },
];

export const CONTEXT_TAB: MenuItemDef[] = [
  { id: "context.tab.save", label: "Save", command: "saveKeyStore" },
  { id: "context.tab.save-all", label: "Save All", command: "saveAllKeyStores" },
  { id: "context.tab.paste", label: "Paste", command: "paste", separatorBefore: true },
  { id: "context.tab.close", label: "Close", command: "closeKeyStore", separatorBefore: true },
  { id: "context.tab.close-others", label: "Close Others", command: "closeOtherKeyStores" },
  { id: "context.tab.close-all", label: "Close All", command: "closeAllKeyStores" },
  { id: "context.tab.properties", label: "Properties", command: "properties", separatorBefore: true },
  { id: "context.tab.export-csv", label: "Export CSV", command: "exportCsv" },
];

export const CONTEXT_KEYSTORE: MenuItemDef[] = [
  { id: "context.keystore.generate-key-pair", label: "Generate Key Pair", command: "generateKeyPair" },
  { id: "context.keystore.generate-secret-key", label: "Generate Secret Key", command: "generateSecretKey" },
  {
    id: "context.keystore.import-trusted-certificate",
    label: "Import Trusted Certificate",
    command: "importTrustedCertificate",
  },
  { id: "context.keystore.import-key-pair", label: "Import Key Pair", command: "importKeyPair" },
  { id: "context.keystore.store-passphrase", label: "Store Passphrase", command: "storePassphrase" },
  {
    id: "context.keystore.verify-signature",
    label: "Verify Signature",
    command: "verifySignature",
    separatorBefore: true,
  },
  { id: "context.keystore.verify-jar", label: "Verify JAR", command: "verifyJar" },
  {
    id: "context.keystore.set-password",
    label: "Set Password",
    command: "setPassword",
    separatorBefore: true,
  },
  {
    id: "context.keystore.change-type",
    label: "Change KeyStore Type",
    command: "changeType",
    submenu: CONTEXT_CHANGE_TYPE,
  },
  { id: "context.keystore.properties", label: "Properties", command: "properties" },
  { id: "context.keystore.export-csv", label: "Export CSV", command: "exportCsv" },
];

export const CONTEXT_KEYPAIR: MenuItemDef[] = [
  {
    id: "context.keypair.details",
    label: "View Details",
    command: "openDetails",
    submenu: [
      {
        id: "context.keypair.details.certificate-chain",
        label: "Certificate Chain",
        command: "openDetails",
      },
      { id: "context.keypair.details.private-key", label: "Private Key", command: "openDetails" },
      { id: "context.keypair.details.public-key", label: "Public Key", command: "openDetails" },
    ],
  },
  { id: "context.keypair.cut", label: "Cut", command: "cut", separatorBefore: true },
  { id: "context.keypair.copy", label: "Copy", command: "copy" },
  {
    id: "context.keypair.export",
    label: "Export",
    command: "exportKeyPair",
    submenu: [
      { id: "context.keypair.export.key-pair", label: "Key Pair", command: "exportKeyPair" },
      {
        id: "context.keypair.export.certificate-chain",
        label: "Certificate Chain",
        command: "exportCertificate",
      },
      { id: "context.keypair.export.private-key", label: "Private Key", command: "exportPrivateKey" },
      { id: "context.keypair.export.public-key", label: "Public Key", command: "exportPublicKey" },
    ],
  },
  { id: "context.keypair.generate-csr", label: "Generate CSR", command: "generateCsr" },
  {
    id: "context.keypair.verify-certificate",
    label: "Verify Certificate",
    command: "verifyCertificate",
  },
  {
    id: "context.keypair.import-ca-reply",
    label: "Import CA Reply",
    command: "importCaReplyFromFile",
    submenu: [
      {
        id: "context.keypair.import-ca-reply.from-file",
        label: "From File",
        command: "importCaReplyFromFile",
      },
      {
        id: "context.keypair.import-ca-reply.from-clipboard",
        label: "From Clipboard",
        command: "importCaReplyFromClipboard",
      },
    ],
  },
  {
    id: "context.keypair.edit-chain",
    label: "Edit Certificate Chain",
    command: "appendToCertificateChain",
    submenu: [
      {
        id: "context.keypair.edit-chain.append",
        label: "Append Certificate",
        command: "appendToCertificateChain",
      },
      {
        id: "context.keypair.edit-chain.remove",
        label: "Remove Certificate",
        command: "removeFromCertificateChain",
      },
    ],
  },
  {
    id: "context.keypair.sign",
    label: "Sign",
    command: "signCsr",
    submenu: [
      { id: "context.keypair.sign.csr", label: "CSR", command: "signCsr" },
      { id: "context.keypair.sign.file", label: "File", command: "signFile" },
      { id: "context.keypair.sign.jar", label: "JAR", command: "signJar" },
      { id: "context.keypair.sign.jwt", label: "JWT", command: "signJwt" },
      { id: "context.keypair.sign.crl", label: "CRL", command: "signCrl" },
      { id: "context.keypair.sign.midlet", label: "MIDlet", command: "signMidlet" },
      { id: "context.keypair.sign.new-key-pair", label: "New Key Pair", command: "signNewKeyPair" },
    ],
  },
  { id: "context.keypair.unlock", label: "Unlock", command: "unlockKeyPair", separatorBefore: true },
  { id: "context.keypair.set-password", label: "Set Password", command: "setKeyPairPassword" },
  { id: "context.keypair.delete", label: "Delete", command: "deleteEntry", separatorBefore: true },
  { id: "context.keypair.rename", label: "Rename", command: "renameEntry" },
];

export const CONTEXT_TRUSTED: MenuItemDef[] = [
  {
    id: "context.trusted.details",
    label: "View Details",
    command: "openDetails",
    submenu: [
      { id: "context.trusted.details.certificate", label: "Certificate", command: "openDetails" },
      { id: "context.trusted.details.public-key", label: "Public Key", command: "openDetails" },
    ],
  },
  { id: "context.trusted.cut", label: "Cut", command: "cut", separatorBefore: true },
  { id: "context.trusted.copy", label: "Copy", command: "copy" },
  {
    id: "context.trusted.export",
    label: "Export",
    command: "exportCertificate",
    submenu: [
      {
        id: "context.trusted.export.certificate",
        label: "Certificate",
        command: "exportCertificate",
      },
      { id: "context.trusted.export.public-key", label: "Public Key", command: "exportPublicKey" },
    ],
  },
  {
    id: "context.trusted.verify-certificate",
    label: "Verify Certificate",
    command: "verifyCertificate",
  },
  { id: "context.trusted.delete", label: "Delete", command: "deleteEntry", separatorBefore: true },
  { id: "context.trusted.rename", label: "Rename", command: "renameEntry" },
];

export const CONTEXT_KEY: MenuItemDef[] = [
  { id: "context.key.details", label: "Details", command: "openDetails" },
  { id: "context.key.cut", label: "Cut", command: "cut", separatorBefore: true },
  { id: "context.key.copy", label: "Copy", command: "copy" },
  { id: "context.key.unlock", label: "Unlock", command: "unlockKey", separatorBefore: true },
  { id: "context.key.set-password", label: "Set Password", command: "setKeyPassword" },
  { id: "context.key.delete", label: "Delete", command: "deleteEntry", separatorBefore: true },
  { id: "context.key.rename", label: "Rename", command: "renameEntry" },
];

export const CONTEXT_MULTI: MenuItemDef[] = [
  { id: "context.multi.details", label: "Details", command: "openDetails" },
  { id: "context.multi.cut", label: "Cut", command: "cut", separatorBefore: true },
  { id: "context.multi.copy", label: "Copy", command: "copy" },
  { id: "context.multi.delete", label: "Delete", command: "deleteEntry" },
  { id: "context.multi.compare", label: "Compare", command: "compareCertificate" },
  { id: "context.multi.export", label: "Export Selected Certificates", command: "exportCertificate" },
  { id: "context.multi.unlock", label: "Unlock", command: "unlockKey" },
];

export const TABLE_COLUMNS = [
  { id: "keystore.table.col.type", label: "Type" },
  { id: "keystore.table.col.lock", label: "Lock" },
  { id: "keystore.table.col.expiry-status", label: "Expiry" },
  { id: "keystore.table.col.alias", label: "Entry Name" },
  { id: "keystore.table.col.algorithm", label: "Algorithm" },
  { id: "keystore.table.col.key-size", label: "Key Size" },
  { id: "keystore.table.col.cert-expiry", label: "Certificate Expiry" },
  { id: "keystore.table.col.last-modified", label: "Last Modified" },
] as const;

function walkItems(items: MenuItemDef[], acc: MenuItemDef[]): void {
  for (const item of items) {
    acc.push(item);
    if (item.submenu) {
      walkItems(item.submenu, acc);
    }
  }
}

export function allMenuItems(): MenuItemDef[] {
  const acc: MenuItemDef[] = [];
  for (const menu of MENUS) {
    acc.push({ id: menu.id, label: menu.label });
    walkItems(menu.items, acc);
  }
  for (const group of TOOLBAR_GROUPS) {
    walkItems(group, acc);
  }
  walkItems(QUICKSTART_ITEMS, acc);
  walkItems(CONTEXT_TAB, acc);
  walkItems(CONTEXT_KEYSTORE, acc);
  walkItems(CONTEXT_KEYPAIR, acc);
  walkItems(CONTEXT_TRUSTED, acc);
  walkItems(CONTEXT_KEY, acc);
  walkItems(CONTEXT_MULTI, acc);
  return acc;
}

const BY_ID = new Map(allMenuItems().map((item) => [item.id, item]));

export function findControl(id: string): MenuItemDef | undefined {
  return BY_ID.get(id);
}
