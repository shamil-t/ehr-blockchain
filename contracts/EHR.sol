// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EHR {
  enum UserType{
    NONE,
    ADMIN,
    DOCTOR,
    PATIENT
  }

  enum AppointmentStatus {
    PENDING,
    APPROVED,
    REJECTED,
    COMPLETED,
    CANCELED
  }

  struct User {
    address id;
    string profileCID;
    bool exists;
  }

  struct Appointment {
    uint256 id;
    address patient;
    address doctor;
    string metadataCID;
    uint256 appointmentTime;
    AppointmentStatus status;
    uint256 createdAt;
  }

  struct MedicalRecord {
    uint256 id;
    address patient;
    address doctor;
    string metadataCID;
    string filesCID;
    uint256 createdAt;
  }

  mapping(address => User) private doctors;
  mapping(address => User) private patients;

  address[] private doctorIds;
  address[] private patientIds;

  address private admin;

  uint256 private appointmentCounter;
  uint256 private medicalCounter;

  mapping(uint256 => Appointment) private appointments;
  mapping(address => uint256 []) private patientAppointmentIds;
  mapping(address => uint256[])  private doctorAppointmentIds;

  mapping(uint256 => MedicalRecord) private medicalRecords;
  mapping(address => uint256[]) private patientMedicalRecords;

  mapping(address => mapping(address => bool)) private doctorAccess;

  constructor() {
    admin = msg.sender;
  }

  function isUser(address id) public view returns (UserType)  {
    if (admin == id) {
      return UserType.ADMIN;
    } else if (doctors[id].exists) {
      return UserType.DOCTOR;
    }
    else if (patients[id].exists) {
      return UserType.PATIENT;
    } else {
      return UserType.NONE;
    }
  }

  function addUser(address id, string  memory dataHash, UserType userType) public {
    require(id != address(0), "Invalid address");
    require(!doctors[id].exists && !patients[id].exists, "User already registered");

    if (userType == UserType.DOCTOR) {
      require(msg.sender == admin, "Only admin can add doctor");
    }

    if (userType == UserType.PATIENT) {
      require(msg.sender != admin && !doctors[msg.sender].exists, "Only patients can add themself");
    }

    if (userType == UserType.DOCTOR) {
      doctors[id] = User({id: id, profileCID: dataHash, exists: true});
      doctorIds.push(id);
    } else if (userType == UserType.PATIENT) {
      patients[id] = User({id: id, profileCID: dataHash, exists: true});
      patientIds.push(id);
    } else {
      revert("not a valid type of user");
    }
  }

  function getAllDoctors() public view returns (User[] memory) {
    User[] memory allDoctors = new User[](doctorIds.length);
    for (uint256 i = 0; i < doctorIds.length; i++) {
      allDoctors[i] = doctors[doctorIds[i]];
    }
    return allDoctors;
  }

  function getDoctorProfile() public onlyDoctor view returns (string memory)  {
    return doctors[msg.sender].profileCID;
  }

  function getPatientProfile(address id) public view returns (string memory)  {
    require(patients[id].exists && (msg.sender == id || hasAccessToRecords(id)), "Access Denied");
    return patients[id].profileCID;
  }

  function addMedicalRecord(address patient, string memory metadataCID, string memory filesCID) public onlyDoctor {
    require(patients[patient].exists, "Patient id is not valid");
    require(doctorAccess[patient][msg.sender], "Doctor has no access to Medical Record");

    medicalCounter++;

    MedicalRecord memory record = MedicalRecord({
      id: medicalCounter,
      patient: patient,
      doctor: msg.sender,
      metadataCID: metadataCID,
      filesCID: filesCID,
      createdAt: block.timestamp
    });

    medicalRecords[medicalCounter] = record;
    patientMedicalRecords[patient].push(medicalCounter);
  }

  function getMedicalRecord(address id) public view returns (MedicalRecord[] memory)  {
    require(hasAccessToRecords(id), "Access denied");

    uint256[] memory ids = patientMedicalRecords[id];
    MedicalRecord[] memory records = new MedicalRecord[](ids.length);

    for (uint256 i = 0; i < ids.length; i++) {
      records[i] = medicalRecords[ids[i]];
    }

    return records;
  }

  function hasAccessToRecords(address patient) public view returns (bool)  {
    return msg.sender == patient || doctorAccess[patient][msg.sender];
  }

  function grantAccessToRecords(address doctor) public onlyPatient {
    doctorAccess[msg.sender][doctor] = true;
  }

  function revokeAccessToRecords(address doctor) public onlyPatient {
    doctorAccess[msg.sender][doctor] = false;
  }

  function addAppointment(address doctor, string memory metadataCID, uint256 appointmentTime, bool isGrant) public onlyPatient {
    require(doctors[doctor].exists, "Not a valid doctor");
    require(appointmentTime > block.timestamp, "Invalid appointment time");
    appointmentCounter++;
    Appointment memory appointment = Appointment({
      id: appointmentCounter,
      patient: msg.sender,
      doctor: doctor,
      metadataCID: metadataCID,
      appointmentTime: appointmentTime,
      status: AppointmentStatus.PENDING,
      createdAt: block.timestamp
    });

    appointments[appointmentCounter] = appointment;

    patientAppointmentIds[msg.sender].push(appointmentCounter);
    doctorAppointmentIds[doctor].push(appointmentCounter);

    if (isGrant) {
      doctorAccess[msg.sender][doctor] = true;
    }
  }

  function updateAppointment(uint256 index, AppointmentStatus status) public {
    Appointment storage appointment = appointments[index];
    require(appointment.id != 0, "Invalid appointment");
//    Patients can cancel Appointments and Doctors can approve or reject appointment
    if (msg.sender == appointment.patient) {
      require(status == AppointmentStatus.CANCELED, "Patients can only cancel");
    } else if (msg.sender == appointment.doctor) {
      require(status != AppointmentStatus.CANCELED, "Doctors can't cancel");
    } else {
      revert("Access denied");
    }
    appointment.status = status;
  }

  function getAppointments() public view returns (Appointment[] memory)  {
    uint256[] memory appIds;
    if (doctors[msg.sender].exists) {
      appIds = doctorAppointmentIds[msg.sender];
    } else if (patients[msg.sender].exists) {
      appIds = patientAppointmentIds[msg.sender];
    } else {
      revert("Not a valid user");
    }
    Appointment[] memory userAppointments = new Appointment[](appIds.length);
    for (uint256 i = 0; i < appIds.length; i++) {
      userAppointments[i] = appointments[appIds[i]];
    }
    return userAppointments;
  }

  function getAllAppointments() public onlyAdmin view returns (Appointment[] memory) {
    Appointment[] memory allAppointments = new Appointment[](appointmentCounter);
    for (uint256 i = 1; i <= appointmentCounter; i++) {
      allAppointments[i - 1] = appointments[i];
    }
    return allAppointments;
  }

  modifier onlyAdmin(){
    require(admin == msg.sender, "Sender is not Admin");
    _;
  }

  modifier onlyDoctor(){
    require(doctors[msg.sender].exists, "Sender is not Doctor");
    _;
  }

  modifier onlyPatient(){
    require(patients[msg.sender].exists, "Sender is not Patient");
    _;
  }

}
