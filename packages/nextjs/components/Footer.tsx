import React from "react";
import { SwitchTheme } from "~~/components/SwitchTheme";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-end items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <SwitchTheme className="pointer-events-auto" />
        </div>
      </div>
      <div className="text-center py-4 text-sm text-base-content/60">
        Event Indexer Registry •{" "}
        <a
          href="https://base.blockscout.com/address/0x006835B9faf4f5244f860862809eCAE555f0abC8"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Contract
        </a>{" "}
        •{" "}
        <a
          href="https://github.com/clawdbotatg/leftclaw-service-job-258"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Source
        </a>
      </div>
    </div>
  );
};
