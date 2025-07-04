"use client";

import React from "react";
import { ccc } from "@ckb-ccc/connector-react";
import ConnectWallet from "../components/wallet/connect-wallet";
import { useSuppressDevWarnings } from "app/hooks/useSuppressDevWarnings";

export default function Web5ConnectPage() {
  const { wallet, open } = ccc.useCcc();
  useSuppressDevWarnings();

  return (
    <section>
     <ConnectWallet className="px-4 py-2 text-sm text-white dark:text-black bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-300 rounded transition-colors" /> 
    </section>
  );
} 
