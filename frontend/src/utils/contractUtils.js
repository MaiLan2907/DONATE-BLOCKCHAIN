import { ethers } from "ethers";

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_mainWallet", type: "address" },
      { internalType: "string", name: "_campaignName", type: "string" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "campaignName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_donor", type: "address" }],
    name: "getDonationAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_donor", type: "address" }],
    name: "getDonationCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_donor", type: "address" }],
    name: "getDonorStats",
    outputs: [
      {
        components: [
          { internalType: "address", name: "walletAddress", type: "address" },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "uint256", name: "donationCount", type: "uint256" },
          {
            internalType: "uint256",
            name: "lastDonationTime",
            type: "uint256",
          },
        ],
        internalType: "struct CharityDonation.Donor",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDonorsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_limit", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUniqueDonorsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_address", type: "address" }],
    name: "isDonor",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mainWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDonations",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_newName", type: "string" }],
    name: "updateCampaignName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_newWallet", type: "address" }],
    name: "updateMainWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "donor",
        type: "address",
      },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalDonated",
        type: "uint256",
      },
    ],
    name: "DonationReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldWallet",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newWallet",
        type: "address",
      },
    ],
    name: "MainWalletChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "newName", type: "string" },
    ],
    name: "CampaignNameChanged",
    type: "event",
  },
  { stateMutability: "payable", type: "receive" },
];

export const getContractInstance = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

    if (!contractAddress) {
      console.warn("Contract address not configured");
      return null;
    }

    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );

    return contract;
  } catch (err) {
    console.error("Error getting contract instance:", err);
    return null;
  }
};

export const getDonationData = async (address) => {
  try {
    const contract = await getContractInstance();
    if (!contract) return null;

    const amount = await contract.getDonationAmount(address);
    const count = await contract.getDonationCount(address);

    return {
      amount: ethers.formatEther(amount),
      count: count.toString(),
    };
  } catch (err) {
    console.error("Error getting donation data:", err);
    return null;
  }
};

export const getTopDonors = async (limit = 10) => {
  try {
    const contract = await getContractInstance();
    if (!contract) return [];

    const [addresses, amounts] = await contract.getLeaderboard(limit);

    return addresses.map((address, index) => ({
      address,
      amount: ethers.formatEther(amounts[index]),
      rank: index + 1,
    }));
  } catch (err) {
    console.error("Error getting top donors:", err);
    return [];
  }
};
