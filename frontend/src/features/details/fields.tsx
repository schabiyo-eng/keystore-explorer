import type { CertDetails, KeyDetails } from "./inspect";

export function ReadField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} readOnly value={value} autoComplete="off" />
    </label>
  );
}

export function EncodedField({ id, value }: { id: string; value: string }) {
  return (
    <label className="field" htmlFor={id}>
      <span>Encoded:</span>
      <textarea id={id} readOnly rows={6} value={value} spellCheck={false} />
    </label>
  );
}

export function KeyFields({ prefix, keyDetails }: { prefix: string; keyDetails: KeyDetails }) {
  return (
    <div className="details-form">
      <ReadField id={`${prefix}.algorithm`} label="Algorithm:" value={keyDetails.algorithm} />
      <ReadField id={`${prefix}.key-size`} label="Key Size:" value={keyDetails.keySize} />
      <ReadField id={`${prefix}.format`} label="Format:" value={keyDetails.format} />
      <EncodedField id={`${prefix}.encoded`} value={keyDetails.encoded} />
    </div>
  );
}

export function CertificateFields({ cert }: { cert: CertDetails }) {
  const prefix = "dialog.view-certificate";
  return (
    <>
      <ReadField id={`${prefix}.version`} label="Version:" value={cert.version} />
      <ReadField id={`${prefix}.subject`} label="Subject:" value={cert.subject} />
      <ReadField id={`${prefix}.issuer`} label="Issuer:" value={cert.issuer} />
      <ReadField
        id={`${prefix}.serial-hex`}
        label="Serial Number (hex.):"
        value={cert.serialHex}
      />
      <ReadField
        id={`${prefix}.serial-dec`}
        label="Serial Number (dec.):"
        value={cert.serialDec}
      />
      <ReadField id={`${prefix}.valid-from`} label="Valid From:" value={cert.validFrom} />
      <ReadField id={`${prefix}.valid-until`} label="Valid Until:" value={cert.validUntil} />
      <ReadField id={`${prefix}.public-key`} label="Public Key:" value={cert.publicKey} />
      <ReadField
        id={`${prefix}.signature-algorithm`}
        label="Signature Algorithm:"
        value={cert.signatureAlgorithm}
      />
      <ReadField id={`${prefix}.fingerprint`} label="Fingerprint:" value={cert.fingerprint} />
    </>
  );
}
