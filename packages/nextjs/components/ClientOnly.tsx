"use client";

import { useEffect, useState } from "react";

/**
 * Renders children only after the component has mounted on the client.
 * Prevents wagmi/RainbowKit hooks from running during the static export
 * prerender pass, where there is no WagmiProvider in the tree.
 */
export const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex grow items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return <>{children}</>;
};
