pragma solidity 0.6.4;

contract Migrations {
  address public owner;
  uint public last_completed_migration;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  constructor() public {
    owner = msg.sender;
  }

  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }

  function isOwner() public view returns(bool success){
    if (msg.sender==owner) return true;
    else return false;
  }
}
