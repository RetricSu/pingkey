import {
  ccc,
  Cell,
  CellInput,
  CellInputLike,
  hashCkb,
  Hex,
  hexFrom,
  numLeToBytes,
  Signer,
  Since,
} from "@ckb-ccc/connector-react";
import { DID_SCRIPT } from "./config";
import * as cbor from "@ipld/dag-cbor";
import * as molecule from "./mol";

export class DIDSDK {
  constructor(
    private readonly signer: Signer,
    public readonly script_info = DID_SCRIPT.testnet
  ) {}

  async findDIDCells() {
    const addressObj = await this.signer.getRecommendedAddressObj();
    const results: Cell[] = [];
    const cells = await this.signer.client.findCells({
      script: addressObj.script,
      scriptType: "lock",
      scriptSearchMode: "exact",
      filter: {
        scriptLenRange: [32 + 1 + 20, 32 + 1 + 20],
        outputData: "0x00000000",
        outputDataSearchMode: "prefix",
      },
    });
    for await (const cell of cells) {
      if (
        cell.cellOutput.type?.codeHash === this.script_info.code_hash &&
        cell.cellOutput.type?.hashType === this.script_info.hash_type
      ) {
        results.push(cell);
      }
    }
    return results;
  }

  async createDID(nostrPublicKey: string, relayUrl: string) {
    const addressObj = await this.signer.getRecommendedAddressObj();
    const argsPlaceholder = "0x" + "00".repeat(20);
    const outputData = this.serializeDIDDocument(nostrPublicKey, relayUrl);
    const tx = ccc.Transaction.from({
      outputs: [
        {
          lock: addressObj.script,
          type: {
            codeHash: this.script_info.code_hash,
            hashType: this.script_info.hash_type,
            args: argsPlaceholder,
          },
        },
      ],
      outputsData: [outputData],
    });
    tx.addCellDeps(...this.script_info.cellDeps.map((dep) => dep.cellDep));
    await tx.completeInputsByCapacity(this.signer);
    await tx.completeFeeBy(this.signer);

    const cellInput = tx.getInput(0)!;
    const args = this.hashDIDCellArgs(cellInput, 0);
    tx.outputs[0].type!.args = args;
    const txHash = await this.signer.sendTransaction(tx);
    return txHash;
  }

  hashDIDCellArgs(cellInputLike: CellInputLike, outputIndex: number) {
    const cellInput = CellInput.from(cellInputLike);
    const hash = hashCkb(
      Since.from(cellInput.since ?? 0).toBytes(),
      cellInput.previousOutput.txHash,
      numLeToBytes(cellInput.previousOutput.index, 8),
      numLeToBytes(outputIndex, 8)
    );
    return hash.slice(0, 42) as Hex; // first 20 bytes
  }

  serializeDIDDocument(nostrPublicKey: string, relayUrl: string) {
    const doc: DIDDocument = {
      verificationMethods: {
        nostr: nostrPublicKey,
      },
      alsoKnownAs: [],
      services: {
        nostr_relays: {
          type: "NostrRelays",
          endpoints: relayUrl,
        },
      },
    };

    const didWeb5Data = molecule.DidWeb5Data.from({
      value: {
        document: cbor.encode(doc),
        localId: null,
      },
    });
    return hexFrom(didWeb5Data.toBytes());
  }

  deserializeDIDDocument(outputData: Hex) {
    const didWeb5Data = molecule.DidWeb5Data.decode(outputData);
    const docs: DIDDocument = cbor.decode(didWeb5Data.value.document);
    return docs;
  }
}

export interface DIDDocument {
  verificationMethods: {
    nostr: string;
  };
  alsoKnownAs: string[];
  services: {
    nostr_relays: {
      type: "NostrRelays";
      endpoints: string;
    };
  };
}
