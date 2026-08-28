export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

/** Parse stored (uncompressed) ZIP/JAR bytes. Returns undefined if not a ZIP. */
export function parseZip(bytes: Uint8Array): ZipEntry[] | undefined {
  if (bytes.length < 30) {
    return undefined;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== LOCAL_SIG) {
    return undefined;
  }
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig === CENTRAL_SIG || sig === EOCD_SIG) {
      break;
    }
    if (sig !== LOCAL_SIG) {
      return undefined;
    }
    const method = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const uncompSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLen + extraLen;
    const dataEnd = dataStart + (method === 0 ? uncompSize : compSize);
    if (dataEnd > bytes.length) {
      return undefined;
    }
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLen));
    if (method !== 0) {
      return undefined;
    }
    entries.push({ name, data: new Uint8Array(bytes.subarray(dataStart, dataEnd)) });
    offset = dataEnd;
  }
  return entries.length > 0 ? entries : undefined;
}
