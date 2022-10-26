import { BigNumberish, TypedDataField } from "ethers";
import { ethers } from "hardhat";

export const getTimestamp = async (): Promise<number> => {
  return (await ethers.provider.getBlock(ethers.provider.blockNumber)).timestamp;
};

export const formatTypedDataField = (
  abi: any,
  functionName: string,
  inputType: string,
  inputName: string,
): Record<string, TypedDataField[]> => {
  const typedDataField = abi
    .find((x: { name: string }) => x.name === functionName)
    ?.inputs.find((x: { name: string }) => x.name === inputName)
    ?.components?.map((x: { [x: string]: unknown; internalType: unknown }) => {
      const { internalType: _, ...formatted } = x;
      return formatted;
    });
  if (!typedDataField) throw new Error("NO TYPED_DATA");

  return {
    [inputType]: typedDataField,
  };
};

// merkle tree utils
// import { keccak256 } from "ethers/lib/utils";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

export const buildMerkleTree = (allowlist: string[], amount: BigNumberish): MerkleTree => {
  const hashedLeafs = allowlist.map(acc => ethers.utils.solidityKeccak256(["address", "uint256"], [acc, amount]));
  return new MerkleTree(hashedLeafs, keccak256, {
    sort: true,
    sortLeaves: true,
    sortPairs: true,
  });
};

export const buildMerkleRoot = (tree: MerkleTree): string => {
  return tree.getHexRoot();
};

export const getMerkleProofs = (tree: MerkleTree, account: string, amount: BigNumberish): string[] => {
  const hashedLeaf = ethers.utils.solidityKeccak256(["address", "uint256"], [account, amount]);
  return tree.getHexProof(hashedLeaf);
};
