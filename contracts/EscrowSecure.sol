// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EscrowSecure {
    mapping(address => uint256) private balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    /*
    Here we have applied check effects interaction to stop reentrancy
    by doing state changes before we perform any interactions
    */
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        //CHECK
        if (balance <= 0) {
            revert("You have no deposited funds to withdraw");
        }

        //EFFECTS
        balances[msg.sender] = 0;

        //INTERACTION
        (bool sent, ) = msg.sender.call{value: balance}("");

        if (!sent) {
            revert("Ether withdrawal failed");
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
