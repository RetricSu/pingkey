import {
  ccc,
  Cell,
  CellInputLike,
  Hex,
  hexFrom,
  Script,
  Signer,
} from "@ckb-ccc/connector-react";
import { DID_SCRIPT } from "./config";
import * as cbor from "@ipld/dag-cbor";
import * as molecule from "./mol";
import base32 from "base32";

export class DIDSDK {
  constructor(
    private readonly signer: Signer,
    public readonly script_info = DID_SCRIPT.testnet
  ) {}

  async getDIDLiveCell(web5DIDString: string) {
    const results: Cell[] = [];
    const args = this.decodeWeb5DIDString(web5DIDString);
    const typeScript = {
      args: args,
      codeHash: this.script_info.code_hash,
      hashType: this.script_info.hash_type,
    } as Script;
    const cells = await this.signer.client.findCells({
      script: typeScript,
      scriptType: "type",
      scriptSearchMode: "exact",
    });
    for await (const cell of cells) {
      results.push(cell);
    }
    if (results.length === 0) {
      return null;
    }
    return results[0];
  }

  async findDIDCells() {
    const addressObj = await this.signer.getRecommendedAddressObj();
    const results: Cell[] = [];
    const cells = await this.signer.client.findCells({
      script: addressObj.script,
      scriptType: "lock",
      scriptSearchMode: "exact",
      filter: {
        scriptLenRange: [32 + 1 + 20, 32 + 1 + 21],
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

  parseDIDCell(cell: Cell) {
    if (cell.cellOutput.type == null) {
      throw new Error("cell output type is null");
    }
    const didWeb5Data = this.deserializeDIDDocument(cell.outputData);
    const didIdentifier = this.encodeWeb5DIDString(cell.cellOutput.type!.args);
    return {
      didIdentifier,
      didWeb5Data,
    };
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
    const hash = ccc.hashTypeId(cellInputLike, outputIndex);
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

    const didWeb5Data = new molecule.DidWeb5Data({
      document: cbor.encode(doc),
      localId: null,
    });
    return hexFrom(didWeb5Data.toBytes());
  }

  deserializeDIDDocument(outputData: Hex) {
    const didWeb5Data = molecule.DidWeb5Data.decode(outputData);
    const docs: DIDDocument = cbor.decode(didWeb5Data.value.document);
    return docs;
  }

  encodeWeb5DIDString(identifier: Hex | string) {
    if (identifier.startsWith("0x")) {
      identifier = identifier.slice(2);
    }
    // Convert hex string to bytes before base32 encoding
    const bytes = Buffer.from(identifier, 'hex');
    const id = base32.encode(bytes).toLowerCase();
    return `did:web5:${id}`;
  }

  decodeWeb5DIDString(did: string) {
    const id = did.split(":")[2];
    // Decode base32 to bytes, then convert bytes to hex string
    const bytes = base32.decode(id);
    const args = Buffer.from(bytes).toString('hex');
    return ("0x" + args) as Hex;
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
