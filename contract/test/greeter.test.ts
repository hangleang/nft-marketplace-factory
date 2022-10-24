import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { Greeter } from "../types";

describe("Greeter testcase", () => {
  let greeter: Greeter;

  before(async () => {
    await deployments.fixture(["Greeter"]);
    greeter = await ethers.getContractAt("Greeter", (await deployments.get("Greeter")).address);
  });

  it("should return the new greeting once it's changed", async () => {
    expect(await greeter.greet()).to.equal("Hello, World!");

    await greeter.setGreeting("Bonjour, le monde!");
    expect(await greeter.greet()).to.equal("Bonjour, le monde!");
  });

  it("should throw error", async () => {
    await expect(greeter.throwError()).revertedWithCustomError(greeter, "GreeterError");
  });
});
