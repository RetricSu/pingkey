/**
 * Collectible is a concept that combines a on-chain letter and a set of DOB assets.
 * 
 * The on-chain letter is a letter that is stored on the CKB chain.
 * The DOB assets are the assets that are stored on the CKB chain.
 * 
 * This file contains the common library for collectible.
 */

import {
  ccc,
  Cell,
  Client,
  Hex,
  ScriptLike,
  Signer,
} from "@ckb-ccc/connector-react";
import { INPUT_TYPE_PROXY_LOCK } from "../config";
import { NostrBindingSDK, TagName, TESTNET_CONFIGS } from "@nostr-binding/sdk";
import { getSporeScriptInfos, transferSpore } from "@ckb-ccc/spore";
import { Event } from "nostr-tools";
import { ParsedOnChainLetter } from "./type";

export function createLockScriptFrom(nostrPublicKey: Hex) {
  const sdk = new NostrBindingSDK(TESTNET_CONFIGS);
  const lockScript = sdk.lock.buildScript(nostrPublicKey);
  return lockScript;
}

export async function createOnChainLetter(
  receiverLock: ScriptLike,
  cccSigner: Signer,
  createLetterEvent: (extraTags: string[][]) => Promise<Event>
) {
  const sdk = new NostrBindingSDK(TESTNET_CONFIGS);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: receiverLock,
        type: sdk.binding.buildScript("00".repeat(32), "00".repeat(32)),
      },
    ],
    outputsData: ["0x00"],
  });
  await tx.completeInputsByCapacity(cccSigner);

  // === Prepare output type ===
  const globalUniqueId = ccc.hashTypeId(tx.inputs[0], 0).slice(2);
  const signedEvent = await createLetterEvent([
    [TagName.ckbGlobalUniqueId, globalUniqueId],
  ]);

  tx.outputs[0].type = ccc.Script.from(
    sdk.binding.buildScript(signedEvent.id, globalUniqueId)
  );
  // ======

  // === Place binding event in witness ===
  const witnessArgs = tx.getWitnessArgsAt(0) ?? ccc.WitnessArgs.from({});
  witnessArgs.outputType = ccc.hexFrom(
    ccc.bytesFrom(JSON.stringify(signedEvent), "utf8")
  );
  tx.setWitnessArgsAt(0, witnessArgs);
  // ======

  tx.addCellDeps(await sdk.binding.buildCellDeps());

  await tx.completeFeeBy(cccSigner, 1000);
  const letterTypeHash = tx.outputs[0].type!.hash();
  return { tx, signedEvent, letterTypeHash };
}

export async function attachLetterWithDOBAssets(
  letterCellTypeHash: Hex,
  sporeId: Hex,
  cccSigner: Signer
) {
  const proxyLock = {
    codeHash: INPUT_TYPE_PROXY_LOCK.testnet.code_hash,
    hashType: INPUT_TYPE_PROXY_LOCK.testnet.hash_type,
    args: letterCellTypeHash.slice(0, 66) as Hex, // first 32 bytes of the hash
  };

  const { tx } = await transferSpore({
    signer: cccSigner,
    id: sporeId,
    to: proxyLock,
  });
  await tx.completeFeeBy(cccSigner, 1000);
  await cccSigner.signTransaction(tx);
  return tx;
}

export function isOnChainLetter(powEvent: Event) {
  const tags = powEvent.tags;
  const ckbGlobalUniqueId = tags.find(
    (tag) => tag[0] === TagName.ckbGlobalUniqueId
  );
  if (!ckbGlobalUniqueId) {
    return false;
  }
  return true;
}

export async function findOnChainLetterCellFrom(
  powWrappedEvent: Event,
  client: Client
) {
  const sdk = new NostrBindingSDK(TESTNET_CONFIGS);
  const tag = powWrappedEvent.tags.find(
    (tag) => tag[0] === TagName.ckbGlobalUniqueId
  );
  const ckbGlobalUniqueId = tag?.[1];
  if (!ckbGlobalUniqueId) {
    throw new Error("ckbGlobalUniqueId not found");
  }
  const script = sdk.binding.buildScript(powWrappedEvent.id, ckbGlobalUniqueId);
  return await client.findSingletonCellByType(script, false);
}

export async function findDOBAssetsFrom(
  lockScript: ScriptLike,
  client: Client
) {
  const sporeScriptInfo = getSporeScriptInfos(client);
  const cells = await client.findCells({
    script: lockScript,
    scriptType: "lock",
    scriptSearchMode: "exact",
  });
  const result: Cell[] = [];
  for await (const cell of cells) {
    if (
      cell.cellOutput.type?.codeHash === sporeScriptInfo.V2?.codeHash &&
      cell.cellOutput.type?.hashType === sporeScriptInfo.V2?.hashType
    ) {
      result.push(cell);
    }
  }
  return result;
}

export async function findOnChainLetter(powWrappedEvent: Event, client: Client): Promise<ParsedOnChainLetter | null> {
  if (!isOnChainLetter(powWrappedEvent)) {
    return null;
  }

  const letterCell = await findOnChainLetterCellFrom(powWrappedEvent, client);
  if (!letterCell) {
    return null;
  }

  const ownerAddress = await ccc.Address.fromScript(letterCell.cellOutput.lock, client);

  const proxyLock = {
    codeHash: INPUT_TYPE_PROXY_LOCK.testnet.code_hash,
    hashType: INPUT_TYPE_PROXY_LOCK.testnet.hash_type,
    args: letterCell.cellOutput.type?.hash().slice(0, 66) as Hex,
  };

  const rawSporeCells = await findDOBAssetsFrom(
    proxyLock,
    client
  );

  // Return raw spore cells - parsing will be handled in the component
  const dobCells = rawSporeCells;

  const result: ParsedOnChainLetter = {
    letter: {
      cell: letterCell,
      ownerAddress,
      powWrappedEvent,
    },
    dobCells,
  };
  return result;
}

export async function transferOnChainLetter(letterCell: Cell, cccSigner: ccc.SignerNostrPrivateKey, receiverLock: ScriptLike){
  const tx = ccc.Transaction.from({
    inputs: [letterCell],
    outputs: [
      {
        lock: receiverLock,
        type: letterCell.cellOutput.type,
      },
    ],
  });

  const sdk = new NostrBindingSDK(TESTNET_CONFIGS);
  tx.addCellDeps(await sdk.binding.buildCellDeps());

  await tx.completeFeeBy(cccSigner, 1000);
  return tx;
}

export async function detachDOBAssetsFrom(parsedOnChainLetter: ParsedOnChainLetter, cccSigner: ccc.SignerNostrPrivateKey, receiverLock: ScriptLike){
  const dobCells = parsedOnChainLetter.dobCells;
  const letterCell = parsedOnChainLetter.letter.cell;
  const tx = ccc.Transaction.from({
    inputs: [letterCell, ...dobCells],
    outputs: [{
      lock: receiverLock,
      type: letterCell.cellOutput.type,
    }, ...dobCells.map((cell) => {
      return {
        lock: receiverLock,
        type: cell.cellOutput.type,
      }
    })],
    outputsData: [letterCell.outputData, ...dobCells.map((cell) => cell.outputData)],
  });
  const sdk = new NostrBindingSDK(TESTNET_CONFIGS);
  tx.addCellDeps(await sdk.binding.buildCellDeps());

  await tx.completeFeeBy(cccSigner, 1000);
  return tx;
}
