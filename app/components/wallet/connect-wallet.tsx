"use client";

import React, { useEffect, useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";

export interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const { open, wallet } = ccc.useCcc();
  const [balance, setBalance] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const signer = ccc.useSigner();

  useEffect(() => {
    if (!signer) {
      return;
    }

    (async () => {
      const addr = await signer.getRecommendedAddress();
      setAddress(addr);
    })();

    (async () => {
      const capacity = await signer.getBalance();
      setBalance(ccc.fixedPointToString(capacity));
    })();

    return () => {};
  }, [signer]);

  const renderConnectWalletBtn = () => {
    return (
      <div className={className} onClick={open}>
        Connect Wallet
      </div>
    );
  };

  const renderConnectedWalletInfo = () => {
    return (
      <div
        className="cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        onClick={open}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full mr-2">
              {wallet && (
                <img src={wallet.icon} alt="avatar" className="w-6 h-6" />
              )}
            </div>
            <h2 className="text-sm font-semibold">{balance} CKB</h2>
          </div>

          <p className="text-xs flex items-center gap-2">
            {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : ""}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      {wallet ? renderConnectedWalletInfo() : renderConnectWalletBtn()}
    </div>
  );
};

export default ConnectWallet;
