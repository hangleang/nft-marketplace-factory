import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { Greeter } from "../types/Greeter";

describe("Greeter testcase", () => {
  it("should return the new greeting once it's changed", async () => {
    await deployments.fixture(["Greeter"]);
    const greeter: Greeter = await ethers.getContract("Greeter");
    expect(await greeter.greet()).to.equal("Hello, World!");

    await greeter.setGreeting("Bonjour, le monde!");
    expect(await greeter.greet()).to.equal("Bonjour, le monde!");
  });

  it("should throw error", async () => {
    await deployments.fixture(["Greeter"]);
    const greeter: Greeter = await ethers.getContract("Greeter");
    await expect(greeter.throwError()).revertedWithCustomError(greeter, "GreeterError");
  });
});
