// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EscrowVulnerable {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 balance = balances[msg.sender];
        if (balance <= 0) {
            revert("You have no deposited funds to withdraw");
        }

        (bool sent, ) = msg.sender.call{value: balance}("");

        /*
        Here is our state change. This is performed after a transfer.
        Allowing an attacker to use a receive() function to drain the funds via reentrancy.
        */
        balances[msg.sender] = 0;

        if (!sent) {
            revert("Ether withdrawal failed");
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
