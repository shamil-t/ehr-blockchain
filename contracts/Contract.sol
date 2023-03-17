// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21;

import "./Roles.sol";

contract Contract {
  using Roles for Roles.Role;

  Roles.Role private admin;
  Roles.Role private doctor;

  struct Doctor {
    address id;
    string drHash;
  }

  mapping(address => Doctor) Doctors;

  address[] public DrIDs;

  constructor() {
    admin.add(msg.sender);
  }

  //get Admin

  function isAdmin() public view returns (bool) {
    return admin.has(msg.sender);
  }

  //Add Doctor

  function addDrInfo(address dr_id, string memory _drInfo_hash) public {
    require(admin.has(msg.sender), "Only For Admin");

    Doctor storage drInfo = Doctors[dr_id];
    drInfo.id = dr_id;
    drInfo.drHash = _drInfo_hash;
    DrIDs.push(dr_id);

    doctor.add(dr_id);
  }

  function getAllDrs() public view returns (address[] memory) {
    return DrIDs;
  }

  function getDr(address _id) public view returns (string memory) {
    return (Doctors[_id].drHash);
  }

  // check is Doctor

  function isDr(address id) public view returns (bool) {
    return doctor.has(id);
  }

}
