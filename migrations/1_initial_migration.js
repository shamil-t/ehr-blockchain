const Migrations = artifacts.require("Migrations");
const Contracts = artifacts.require("Contract");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};

module.exports = function(deployer) {
  deployer.deploy(Contracts);
};