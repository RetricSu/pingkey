import { mol, hexFrom, numFrom, ccc } from "@ckb-ccc/core";
import type {
  HexLike,
  Hex,
  NumLike,
  Num,
  BytesLike,
  Bytes,
} from "@ckb-ccc/core";
// the 1.9.0 version of @ckb-ccc/core complaints about type errors, so we use 1.8.1

/**
 * 
table DidWeb5DataV1 {
    document: Bytes,
    local_id: StringOpt,
}

union DidWeb5Data {
    DidWeb5DataV1,
}
 */
export interface DidWeb5DataV1 {
  document: Bytes;
  localId?: Bytes | null;
}

export interface DidWeb5DataV1Like {
  document: BytesLike;
  localId?: BytesLike | null;
}

export const DidWeb5DataV1Codec = mol.table({
  document: mol.Bytes,
  localId: mol.BytesOpt,
});

@mol.codec(DidWeb5DataV1Codec)
export class DidWeb5DataV1 extends mol.Entity.Base<
  DidWeb5DataV1Like,
  DidWeb5DataV1
>() {
  constructor(document: BytesLike, localId?: BytesLike) {
    super();

    this.document = ccc.bytesFrom(document);
    this.localId = localId ? ccc.bytesFrom(localId) : undefined;
  }

  static from(data: DidWeb5DataV1Like): DidWeb5DataV1 {
    if (data instanceof DidWeb5DataV1) {
      return data;
    }
    return new DidWeb5DataV1(data.document, data.localId ?? undefined);
  }
}

export interface DidWeb5Data {
  type: "DidWeb5DataV1";
  value: DidWeb5DataV1;
}

export interface DidWeb5DataLike {
  value: DidWeb5DataV1Like;
}

export const DidWeb5DataCodec = mol.union({
  DidWeb5DataV1,
});

@mol.codec(DidWeb5DataCodec)
export class DidWeb5Data extends mol.Entity.Base<
  DidWeb5DataLike,
  DidWeb5Data
>() {
  constructor(data: DidWeb5DataV1Like) {
    super();
    this.type = "DidWeb5DataV1";
    this.value = DidWeb5DataV1.from(data);
  }

  static from(data: DidWeb5DataLike): DidWeb5Data {
    if (data instanceof DidWeb5Data) {
      return data;
    }
    return new DidWeb5Data(data.value);
  }
}
