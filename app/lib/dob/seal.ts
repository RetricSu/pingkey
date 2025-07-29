import { ccc, Hex, ScriptLike, Signer } from "@ckb-ccc/connector-react";
import { INPUT_TYPE_PROXY_LOCK } from "../config";
import { NostrBindingSDK, TagName, TESTNET_CONFIGS } from "@nostr-binding/sdk";
import { transferSpore } from "@ckb-ccc/spore";
import { Event } from "nostr-tools";

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

  tx.addCellDeps(
    await sdk.binding.buildCellDeps(),
    await sdk.lock.buildCellDeps()
  );

  await tx.completeFeeBy(cccSigner, 1000);

  const letterTypeHash = tx.outputs[0].type!.hash();
  return { tx, signedEvent, letterTypeHash };
}

export async function sealLetterWithDOBStamp(
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
