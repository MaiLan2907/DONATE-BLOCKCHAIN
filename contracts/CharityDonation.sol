// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CharityDonation
 * @dev Transparent charity donation system using blockchain
 * Allows users to donate ETH with MetaMask and maintains public leaderboard
 */
contract CharityDonation {
    // Main wallet that receives all donations
    address public mainWallet;
    
    // Owner of the contract
    address public owner;
    
    // Total donations received
    uint256 public totalDonations;
    
    // Campaign name
    string public campaignName;
    
    // Donation tracking
    struct Donor {
        address walletAddress;
        uint256 totalAmount;
        uint256 donationCount;
        uint256 lastDonationTime;
    }
    
    // Track donors
    mapping(address => Donor) public donors;
    address[] public donorList;
    
    // Events for transparency
    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 timestamp,
        uint256 totalDonated
    );
    
    event MainWalletChanged(address indexed oldWallet, address indexed newWallet);
    event CampaignNameChanged(string newName);
    
    /**
     * @dev Constructor to initialize the contract
     * @param _mainWallet Address that will receive all donations
     * @param _campaignName Name of the donation campaign
     */
    constructor(address _mainWallet, string memory _campaignName) {
        require(_mainWallet != address(0), "Invalid main wallet address");
        mainWallet = _mainWallet;
        owner = msg.sender;
        campaignName = _campaignName;
        totalDonations = 0;
    }
    
    /**
     * @dev Receive function to accept ETH donations
     */
    receive() external payable {
        _processDonation();
    }
    
    /**
     * @dev Fallback function for donations
     */
    fallback() external payable {
        _processDonation();
    }
    
    /**
     * @dev Public donation function
     */
    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        _processDonation();
    }
    
    /**
     * @dev Internal function to process donations
     */
    function _processDonation() internal {
    require(msg.value > 0, "Donation amount must be greater than 0");

    if (donors[msg.sender].walletAddress == address(0)) {
        donors[msg.sender] = Donor({
            walletAddress: msg.sender,
            totalAmount: msg.value,
            donationCount: 1,
            lastDonationTime: block.timestamp
        });
        donorList.push(msg.sender);
    } else {
        donors[msg.sender].totalAmount += msg.value;
        donors[msg.sender].donationCount += 1;
        donors[msg.sender].lastDonationTime = block.timestamp;
    }

    totalDonations += msg.value;

    emit DonationReceived(
        msg.sender,
        msg.value,
        block.timestamp,
        donors[msg.sender].totalAmount
    );
    }
    function withdraw(uint256 _amount) public onlyOwner {
    require(_amount > 0, "Amount must be greater than 0");
    require(_amount <= address(this).balance, "Insufficient contract balance");

    (bool success, ) = mainWallet.call{value: _amount}("");
    require(success, "Withdraw failed");
    }


    /**
     * @dev Get donation amount from a specific donor
     * @param _donor Address of the donor
     * @return Total donation amount
     */
    function getDonationAmount(address _donor) public view returns (uint256) {
        return donors[_donor].totalAmount;
    }
    
    /**
     * @dev Get donation count from a specific donor
     * @param _donor Address of the donor
     * @return Number of donations
     */
    function getDonationCount(address _donor) public view returns (uint256) {
        return donors[_donor].donationCount;
    }
    
    /**
     * @dev Get leaderboard of top donors
     * @param _limit Number of top donors to return
     * @return Array of donor addresses sorted by donation amount
     * @return Array of donation amounts
     */
    function getLeaderboard(uint256 _limit) public view returns (
        address[] memory,
        uint256[] memory
    ) {
        require(_limit > 0, "Limit must be greater than 0");
        
        uint256 length = donorList.length;
        uint256 resultLength = _limit > length ? length : _limit;
        
        address[] memory topDonors = new address[](resultLength);
        uint256[] memory topAmounts = new uint256[](resultLength);
        
        // Simple bubble sort to get top donors
        address[] memory sortedDonors = new address[](length);
        uint256[] memory sortedAmounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            sortedDonors[i] = donorList[i];
            sortedAmounts[i] = donors[donorList[i]].totalAmount;
        }
        
        // Sort in descending order
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (sortedAmounts[i] < sortedAmounts[j]) {
                    // Swap amounts
                    uint256 tempAmount = sortedAmounts[i];
                    sortedAmounts[i] = sortedAmounts[j];
                    sortedAmounts[j] = tempAmount;
                    
                    // Swap addresses
                    address tempAddr = sortedDonors[i];
                    sortedDonors[i] = sortedDonors[j];
                    sortedDonors[j] = tempAddr;
                }
            }
        }
        
        // Get top results
        for (uint256 i = 0; i < resultLength; i++) {
            topDonors[i] = sortedDonors[i];
            topAmounts[i] = sortedAmounts[i];
        }
        
        return (topDonors, topAmounts);
    }
    
    /**
     * @dev Get full donor statistics
     * @param _donor Address of the donor
     * @return Donor struct with all information
     */
    function getDonorStats(address _donor) public view returns (Donor memory) {
        return donors[_donor];
    }
    
    /**
     * @dev Get all donors count
     * @return Total number of donors
     */
    function getDonorsCount() public view returns (uint256) {
        return donorList.length;
    }
    
    /**
     * @dev Get total number of donors (non-zero contributors)
     * @return Count of unique donors
     */
    function getUniqueDonorsCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < donorList.length; i++) {
            if (donors[donorList[i]].totalAmount > 0) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Update the main wallet address (only owner)
     * @param _newWallet New wallet address
     */
    function updateMainWallet(address _newWallet) public onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        address oldWallet = mainWallet;
        mainWallet = _newWallet;
        emit MainWalletChanged(oldWallet, _newWallet);
    }
    
    /**
     * @dev Update campaign name (only owner)
     * @param _newName New campaign name
     */
    function updateCampaignName(string memory _newName) public onlyOwner {
        require(bytes(_newName).length > 0, "Campaign name cannot be empty");
        campaignName = _newName;
        emit CampaignNameChanged(_newName);
    }
    
    /**
     * @dev Check if address is a donor
     * @param _address Address to check
     * @return True if address has donated
     */
    function isDonor(address _address) public view returns (bool) {
        return donors[_address].totalAmount > 0;
    }
    
    /**
     * @dev Modifier to restrict functions to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Get contract balance
     * @return Current ETH balance of the contract
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
