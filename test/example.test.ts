import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import chai, { expect, assert } from "chai";
import { solidity } from "ethereum-waffle";
import {
  EscrowSecure,
  EscrowSecure__factory,
  EscrowVulnerable,
  EscrowVulnerable__factory,
  HackerSucceeds,
  HackerSucceeds__factory,
  HackerFails,
  HackerFails__factory,
} from "../typechain";
chai.use(solidity);

function etherToWei(value: number) {
  return ethers.utils.parseEther(value.toString());
}


describe("Test Suite", function () {
  let EscrowSecureContract: EscrowSecure;
  let EscrowSecureFactory: EscrowSecure__factory;
  let EscrowVulnerableContract: EscrowVulnerable;
  let EscrowVulnerableFactory: EscrowVulnerable__factory;
  let HackerSucceedsContract: HackerSucceeds;
  let HackerSucceedsFactory: HackerSucceeds__factory;
  let HackerFailsContract: HackerFails;
  let HackerFailsFactory: HackerFails__factory;
  let alice: Signer;
  let bob: Signer;
  let hacker: Signer;
  let deposit_amount = etherToWei(1);

  before(async () => {
    [alice, bob, hacker] = await ethers.getSigners();
    EscrowVulnerableFactory = <EscrowVulnerable__factory>(
      await ethers.getContractFactory("EscrowVulnerable")
    );
    EscrowVulnerableContract = await EscrowVulnerableFactory.deploy();
    await EscrowVulnerableContract.deployed();

    EscrowSecureFactory = <EscrowSecure__factory>(
      await ethers.getContractFactory("EscrowSecure")
    );
    EscrowSecureContract = await EscrowSecureFactory.deploy();
    await EscrowSecureContract.deployed();

    HackerSucceedsFactory = <HackerSucceeds__factory>(
      await ethers.getContractFactory("HackerSucceeds")
    );
    HackerSucceedsContract = await HackerSucceedsFactory.deploy(
      EscrowVulnerableContract.address
    );
    await HackerSucceedsContract.deployed();

    HackerFailsFactory = <HackerFails__factory>(
      await ethers.getContractFactory("HackerFails")
    );
    HackerFailsContract = await HackerFailsFactory.deploy(
      EscrowSecureContract.address
    );
    await HackerFailsContract.deployed();
  });

  describe("Successful Reentrancy Attack", function () {
    it("Alice and Bob should deposit some ether to the vulnerable contract", async () => {
      await EscrowVulnerableContract.connect(alice).deposit({
        value: deposit_amount
      });
      await EscrowVulnerableContract.connect(bob).deposit({
        value: deposit_amount
      });
    });
    it("Attacker should call attack() which will attempt to exploit a reentrancy vulnerable function and succeed to steal the ether deposited by alice and bob", async () => {
      expect(Number(await EscrowVulnerableContract.getBalance())).to.be.greaterThan(2)
      await expect(HackerSucceedsContract.connect(hacker).attack({value: ethers.utils.parseUnits("1", "ether")})).to.not.be.reverted;
      expect(Number(await EscrowVulnerableContract.getBalance())).to.be.lessThan(1)
      expect(Number(await HackerSucceedsContract.getBalance())).to.be.greaterThan(2)

    });
  });
  describe("Mitigated Reentrancy Attack", function () {
    it("Alice and Bob should deposit some ether to the secured contract", async () => {
      await EscrowSecureContract.connect(alice).deposit({
        value: deposit_amount,
      });
      await EscrowSecureContract.connect(bob).deposit({
        value: deposit_amount
      });
    });
    it("Attacker should call attack() which will attempt to exploit a reentancy secured function and fail to steal the ether deposited by alice and bob", async () => {
      expect(Number(await EscrowSecureContract.getBalance())).to.be.greaterThan(2)
      await expect(HackerFailsContract.connect(hacker).attack({value: ethers.utils.parseUnits("1", "ether")})).to.be.reverted;
      expect(Number(await EscrowSecureContract.getBalance())).to.be.greaterThan(2)
    });
  });
});
