import {
  mol,
  hexFrom,
  numFrom,
  ccc,
} from "@ckb-ccc/core";
import type {
  HexLike,
  Hex,
  NumLike,
  Num,
  BytesLike,
  Bytes,
} from "@ckb-ccc/core";
// the 1.9.0 version of @ckb-ccc/core complaints about type errors, so we use 1.8.1

// table DidWeb5DataV1 {
//     document: Bytes,
//     localId: StringOpt,
// }
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
  constructor(document: Hex, localId?: Hex) {
    super();

    this.document = ccc.bytesFrom(document);
    this.localId = localId ? ccc.bytesFrom(localId) : undefined;
  }
}

// union DidWeb5Data {
//   DidWeb5DataV1,
// }

export type DidWeb5DataLike = {
  value: DidWeb5DataV1Like;
};

@mol.codec(mol.union({ DidWeb5DataV1 }))
export class DidWeb5Data extends mol.Entity.Base<
  DidWeb5DataLike,
  DidWeb5Data
>() {
  constructor(public type: "DidWeb5DataV1", public value: DidWeb5DataV1) {
    super();
  }

  static from(data: DidWeb5DataLike): DidWeb5Data {
    if (data instanceof DidWeb5Data) {
      return data;
    }
    return new DidWeb5Data("DidWeb5DataV1", DidWeb5DataV1.from(data.value));
  }
}

// table PlcAuthorization {
//     history: BytesVec,
//     sig: Bytes,
//     signingKeys: Uint8Vec,
// }
export type PlcAuthorizationLike = {
  history: HexLike[];
  sig: HexLike;
  signingKeys: NumLike[];
};

@mol.codec(
  mol.table({
    history: mol.BytesVec,
    sig: mol.Bytes,
    signingKeys: mol.Uint8Vec,
  })
)
export class PlcAuthorization extends mol.Entity.Base<
  PlcAuthorizationLike,
  PlcAuthorization
>() {
  constructor(
    public history: Hex[],
    public sig: Hex,
    public signingKeys: Num[]
  ) {
    super();
  }

  static from(data: PlcAuthorizationLike): PlcAuthorization {
    if (data instanceof PlcAuthorization) {
      return data;
    }
    return new PlcAuthorization(
      data.history.map((h) => hexFrom(h)),
      hexFrom(data.sig),
      data.signingKeys.map((s) => numFrom(s))
    );
  }
}

// table DidWeb5Witness {
//   localIdAuthorization: PlcAuthorization,
// }

export type DidWeb5WitnessLike = {
  localIdAuthorization: PlcAuthorizationLike;
};

@mol.codec(
  mol.table({
    localIdAuthorization: PlcAuthorization,
  })
)
export class DidWeb5Witness extends mol.Entity.Base<
  DidWeb5WitnessLike,
  DidWeb5Witness
>() {
  constructor(public localIdAuthorization: PlcAuthorization) {
    super();
  }

  static from(data: DidWeb5WitnessLike): DidWeb5Witness {
    if (data instanceof DidWeb5Witness) {
      return data;
    }
    return new DidWeb5Witness(PlcAuthorization.from(data.localIdAuthorization));
  }
}
