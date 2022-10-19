import { run } from "hardhat";

export const verify = async (address: string, args: unknown[]) => {
  try {
    return await run("verify:verify", {
      address: address,
      constructorArguments: args,
    });
  } catch (e) {
    console.log(address, args, e);
  }
};
