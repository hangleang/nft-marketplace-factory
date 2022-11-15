import { chainIds } from "./hardhat.config";

type ChainToAddress = { [chain in keyof typeof chainIds | string]: string };
export const DEV_CHAINS: string[] = ["hardhat", "localhost"];
export const VERIFICATION_BLOCK_CONFIRMATIONS: number = 3;
export const NATIVE_TOKEN_WRAPPERS: ChainToAddress = {
  "polygon-mumbai": "0xBA03B53D826207c39453653f655d147d4BCBA7B4",
  goerli: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
};
export const TRUST_FORWARDERS: ChainToAddress = {
  "polygon-mumbai": "0x7A95fA73250dc53556d264522150A940d4C50238",
  goerli: "0x7A95fA73250dc53556d264522150A940d4C50238",
};
export const MARKETPLACE_ADDRESS: ChainToAddress = {
  "polygon-mumbai": "0xC10c4A2F88924222fB33B048b494318cdE757DB8",
  goerli: "0xd9a5fA95E554B124F07c0646a0eACAd9e00e06D2",
};
