"use client";

import React from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { CSSProperties } from "react";
import { useSuppressDevWarnings } from "../hooks/useSuppressDevWarnings";

export function CCCProvider({ children }: { children: React.ReactNode }) {
  // 抑制开发模式下的CCC自定义元素重复注册警告
  useSuppressDevWarnings();

  const defaultClient = React.useMemo(() => {
    return process.env.REACT_APP_IS_MAINNET === "true"
      ? new ccc.ClientPublicMainnet()
      : new ccc.ClientPublicTestnet();
  }, []);

  return (
    <ccc.Provider
      connectorProps={{
        style: {
          "--background": "#232323",
          "--divider": "rgba(255, 255, 255, 0.1)",
          "--btn-primary": "#2D2F2F",
          "--btn-primary-hover": "#515151",
          "--btn-secondary": "#2D2F2F",
          "--btn-secondary-hover": "#515151",
          "--icon-primary": "#FFFFFF",
          "--icon-secondary": "rgba(255, 255, 255, 0.6)",
          color: "#ffffff",
          "--tip-color": "#666",
        } as CSSProperties,
      }}
      defaultClient={defaultClient}
      clientOptions={[
        {
          name: "CKB Testnet",
          client: new ccc.ClientPublicTestnet(),
        },
        {
          name: "CKB Mainnet",
          client: new ccc.ClientPublicMainnet(),
        },
      ]}
    >
      {children}
    </ccc.Provider>
  );
}
