const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CharityDonation Contract", function () {
  let charityDonation;
  let owner;
  let mainWallet;
  let donor1;
  let donor2;
  let donor3;

  beforeEach(async function () {
    // Get signers
    [owner, mainWallet, donor1, donor2, donor3] = await ethers.getSigners();

    // Deploy contract
    const CharityDonation = await ethers.getContractFactory("CharityDonation");
    charityDonation = await CharityDonation.deploy(
      mainWallet.address,
      "Test Campaign"
    );
    await charityDonation.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct main wallet", async function () {
      expect(await charityDonation.mainWallet()).to.equal(mainWallet.address);
    });

    it("Should set the correct campaign name", async function () {
      expect(await charityDonation.campaignName()).to.equal("Test Campaign");
    });

    it("Should set the owner correctly", async function () {
      expect(await charityDonation.owner()).to.equal(owner.address);
    });

    it("Should initialize total donations to 0", async function () {
      expect(await charityDonation.totalDonations()).to.equal(0);
    });
  });

  describe("Donations", function () {
    it("Should accept a donation", async function () {
      const donationAmount = ethers.parseEther("1.0");
      
      await expect(
        donor1.sendTransaction({
          to: await charityDonation.getAddress(),
          value: donationAmount,
        })
      ).to.emit(charityDonation, "DonationReceived");

      expect(await charityDonation.getDonationAmount(donor1.address)).to.equal(
        donationAmount
      );
    });

    it("Should track multiple donations from same donor", async function () {
      const donation1 = ethers.parseEther("1.0");
      const donation2 = ethers.parseEther("0.5");

      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: donation1,
      });

      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: donation2,
      });

      expect(await charityDonation.getDonationAmount(donor1.address)).to.equal(
        donation1 + donation2
      );

      expect(await charityDonation.getDonationCount(donor1.address)).to.equal(2);
    });

    it("Should update total donations", async function () {
      const donation = ethers.parseEther("1.5");

      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: donation,
      });

      expect(await charityDonation.totalDonations()).to.equal(donation);
    });

    it("Should reject donation with 0 value", async function () {
      await expect(charityDonation.connect(donor1).donate()).to.be.revertedWith(
        "Donation amount must be greater than 0"
      );
    });

    it("Should transfer funds to main wallet", async function () {
      const donationAmount = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(mainWallet.address);

      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: donationAmount,
      });

      const finalBalance = await ethers.provider.getBalance(mainWallet.address);
      expect(finalBalance).to.equal(initialBalance + donationAmount);
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      // Add multiple donations
      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("3.0"),
      });

      await donor2.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("2.0"),
      });

      await donor3.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should return leaderboard sorted by donation amount", async function () {
      const [addresses, amounts] = await charityDonation.getLeaderboard(3);

      expect(addresses[0]).to.equal(donor1.address);
      expect(addresses[1]).to.equal(donor2.address);
      expect(addresses[2]).to.equal(donor3.address);

      expect(amounts[0]).to.equal(ethers.parseEther("3.0"));
      expect(amounts[1]).to.equal(ethers.parseEther("2.0"));
      expect(amounts[2]).to.equal(ethers.parseEther("1.0"));
    });

    it("Should limit leaderboard results", async function () {
      const [addresses, amounts] = await charityDonation.getLeaderboard(2);

      expect(addresses.length).to.equal(2);
      expect(amounts.length).to.equal(2);
    });

    it("Should return all donors if limit exceeds count", async function () {
      const [addresses, amounts] = await charityDonation.getLeaderboard(10);

      expect(addresses.length).to.equal(3);
      expect(amounts.length).to.equal(3);
    });
  });

  describe("Donor Statistics", function () {
    it("Should get donor stats", async function () {
      const donationAmount = ethers.parseEther("2.0");

      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: donationAmount,
      });

      const stats = await charityDonation.getDonorStats(donor1.address);

      expect(stats.walletAddress).to.equal(donor1.address);
      expect(stats.totalAmount).to.equal(donationAmount);
      expect(stats.donationCount).to.equal(1);
    });

    it("Should identify donors correctly", async function () {
      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      expect(await charityDonation.isDonor(donor1.address)).to.be.true;
      expect(await charityDonation.isDonor(donor2.address)).to.be.false;
    });

    it("Should count unique donors", async function () {
      await donor1.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      await donor2.sendTransaction({
        to: await charityDonation.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      expect(await charityDonation.getUniqueDonorsCount()).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should update main wallet (owner only)", async function () {
      const newWallet = donor1.address;

      await expect(
        charityDonation.connect(owner).updateMainWallet(newWallet)
      ).to.emit(charityDonation, "MainWalletChanged");

      expect(await charityDonation.mainWallet()).to.equal(newWallet);
    });

    it("Should not update wallet if not owner", async function () {
      await expect(
        charityDonation
          .connect(donor1)
          .updateMainWallet(donor2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should update campaign name (owner only)", async function () {
      const newName = "New Campaign Name";

      await expect(
        charityDonation.connect(owner).updateCampaignName(newName)
      ).to.emit(charityDonation, "CampaignNameChanged");

      expect(await charityDonation.campaignName()).to.equal(newName);
    });

    it("Should not update campaign name if not owner", async function () {
      await expect(
        charityDonation.connect(donor1).updateCampaignName("New Name")
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});
