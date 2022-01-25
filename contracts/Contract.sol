// SPDX-License-Identifier: MIT
pragma solidity >= 0.4.21;

import './Roles.sol';

contract Contract{

    using Roles for Roles.Role;

    Roles.Role private admin;
    Roles.Role private doctor;
    Roles.Role private patient;

    struct Doctor{
        string drHash;
    }

    struct Patient{
        string patHash;
    }

    struct MedRec{
        string RecordHash;
    }

    mapping(address => Doctor) Doctors;
    mapping(address => Patient) Patients;
    mapping(address => MedRec) Records;

    address[] public Dr_ids;
    address[] public Patient_ids;
    string[] public RecordHashes;

    address accountId;
    address admin_id;
    address get_patient_id;
    address get_dr_id;

    constructor() {
        admin_id = msg.sender;
        admin.add(admin_id);
    }

    //get Admin

    function getAdmin() public view returns(address){
        return admin_id;
    }

    /*
    
        Doctor
    
    */
    //Add Doctor

    function addDrInfo(address dr_id, string memory _drInfo_hash) public{
        require(admin.has(msg.sender), 'Only For Doctor');

        Doctor storage drInfo = Doctors[dr_id];
        drInfo.drHash = _drInfo_hash;
        Dr_ids.push(dr_id);

        doctor.add(dr_id);
    }

    function updateInfo(address dr_id, string memory _drInfo_hash) public{
        Doctor storage drInfo = Doctors[msg.sender];
        drInfo.drHash = _drInfo_hash;
        Dr_ids.push(dr_id);
    }

    function addDoctor(address _newdr) external onlyAdmin() {
        doctor.add(_newdr);
    }

    function delDr(address _accid) external onlyAdmin(){
        doctor.remove(_accid);
    }

    function get_drtid() public view returns(address){
        return get_dr_id;
    }

    function search(address _id)public{
        get_dr_id = _id;
    }

    function getDrInfo() public view returns(string memory){
        return (Doctors[get_dr_id].drHash);
    }

    function getDr(address _id) public view returns(string memory){
        return (Doctors[_id].drHash);
    }

    function isDr(address id) public view returns(string memory){
        require(doctor.has(id), "Only for Doctors");
        return "1";
    }

    function isDoctor(address id) public view returns(int){
        // require(doctor.has(msg.sender), "Only for Doctors");
        for(uint i=0;i<=Dr_ids.length;i++){
            if(Dr_ids[i] == id){
                return 1;
            }
        }
        return 0;
    }
    
    function getAllDrs() public view returns(address[] memory){
        return(Dr_ids);
    }

    function getDoctorCount() public view returns(uint){
        return(Dr_ids.length);
    }

    // function getAllDrDetails() onlyAdmin() public view returns(string[] memory) {
    //     drIds = 
    //     return ['']
    // }
    /*
            Patient
    
    */
    function isPat(address id) public view returns(string memory){
        require(patient.has(id), "Only for Doctors");
        return "1";
    }
    function addPatient(address _newpatient) external onlyAdmin() {
        patient.add(_newpatient);
    }

    function addRec(address _patid) external onlyDoctor() {
        require(patient.has(_patid) == true, "is not a Patient");
        get_patient_id = _patid;
    }
    function viewPatRec(address _patid) public{
        get_patient_id = _patid;
    }

    function delPat(address _accid) external onlyAdmin(){
        patient.remove(_accid);
    }
    function get() public view  returns(address){
        return msg.sender;
    }
    function get_patid() public view returns(address){
        return get_patient_id;
    }
    function getPatInfo(address iD)public view returns(string memory){
        return (Patients[iD].patHash);
    }
    function addPatInfo(address pat_id, string memory _patInfoHash) public {
        require(admin.has(msg.sender) == true, 'Only you Can Add your info ');
        Patient storage patInfo = Patients[msg.sender];
        patInfo.patHash = _patInfoHash;
        Patient_ids.push(msg.sender);

        patient.add(pat_id);
    }

    /*
    
        Medical Records
    
    
    */

    function addMedRecord(string memory _recHash, address _pat_id) public{
        require(doctor.has(msg.sender) == true, 'Only Doctor Can Do That');

        MedRec storage record = Records[_pat_id];
        record.RecordHash = _recHash;
        RecordHashes.push(_recHash);
    }

    function viewMedRec()public view returns(string memory){
        return (Records[get_patient_id].RecordHash);
    }

    /*
        Modifiers
    */


    modifier onlyAdmin(){
        require(admin.has(msg.sender) == true, 'Only Admin Can Do That');
        _;
    }
    modifier onlyDoctor(){
        require(doctor.has(msg.sender) == true, 'Only Doctor Can Do That');
        _;
    }
    modifier onlyPatient(){
        require(patient.has(msg.sender) == true, 'Only Admin Can Do That');
        _;
    }

}