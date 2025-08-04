import { Address, Cell } from "@ckb-ccc/connector-react";
import { Event } from "nostr-tools";

export interface ParsedOnChainLetter {
  letter: {
    cell: Cell;
    ownerAddress: Address; // will be the receiver's nostr-binding address on CKB by default
    powWrappedEvent: Event;
  };
  dobCells: Cell[];
}
