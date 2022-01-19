const Migrations = artifacts.require("Migrations");
const Contract = artifacts.require("Contract")

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};

module.exports = function (deployer) {
  deployer.deploy(Contract);
}