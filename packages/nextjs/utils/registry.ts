export const REGISTRY_ADDRESS = "0x006835B9faf4f5244f860862809eCAE555f0abC8" as const;

// Approx deployment block on Base for event scans. Lookups page through history from here.
export const REGISTRY_FROM_BLOCK = 0n;

export const shortHex = (value?: string, lead = 6, tail = 4) => {
  if (!value) return "—";
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
};

export const blockscoutAddress = (address?: string) => `https://base.blockscout.com/address/${address ?? ""}`;
