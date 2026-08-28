export interface SystemField {
  id: string;
  label: string;
  value: string;
}

interface JsHeap {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
}

function heapMemory(): JsHeap | undefined {
  if (typeof performance === "undefined") {
    return undefined;
  }
  return (performance as { memory?: JsHeap }).memory;
}

function memoryKb(bytes: number | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return "Unknown";
  }
  return `${Math.round(bytes / 1024)} kB`;
}

/** Swing `DSystemInformation` field list, filled from the browser environment. */
export function systemFields(): SystemField[] {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  const loc = typeof location === "undefined" ? undefined : location;
  const heap = heapMemory();
  const free =
    heap?.totalJSHeapSize !== undefined && heap.usedJSHeapSize !== undefined
      ? heap.totalJSHeapSize - heap.usedJSHeapSize
      : undefined;

  return [
    { id: "hostname", label: "Hostname:", value: loc?.hostname || "Unknown" },
    { id: "operating-system", label: "Operating System:", value: nav?.userAgent || "Unknown" },
    { id: "default-locale", label: "Default Locale:", value: nav?.language || "Unknown" },
    { id: "java-version", label: "Java Version:", value: nav?.userAgent || "Unknown" },
    {
      id: "java-vendor",
      label: "Java Vendor:",
      value: nav?.vendor ? `${nav.vendor} (${loc?.origin ?? ""})` : "Unknown",
    },
    { id: "java-home", label: "Java Home:", value: loc?.origin || "Unknown" },
    { id: "jvm-maximum-memory", label: "JVM Maximum Memory:", value: memoryKb(heap?.jsHeapSizeLimit) },
    { id: "jvm-total-memory", label: "JVM Total Memory:", value: memoryKb(heap?.totalJSHeapSize) },
    { id: "jvm-free-memory", label: "JVM Free Memory:", value: memoryKb(free) },
    {
      id: "available-processors",
      label: "Available Processors:",
      value: nav?.hardwareConcurrency?.toString() || "Unknown",
    },
  ];
}
