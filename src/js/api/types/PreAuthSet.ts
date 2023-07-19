/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { IdentityData } from "./IdentityData";

export type PreAuthSet = {
  identity_data: IdentityData;
  /**
   * The device's public key (PEM encoding), generated by the device or pre-provisioned by the vendor. Currently supported public algorithms are: RSA, ED25519 and ECDSA.
   */
  pubkey: string;
};
