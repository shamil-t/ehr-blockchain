import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import ipfs from '../ipfs';
import pat_ico from '../images/pat_ico.png';
import pdf from '../images/pdf.png'
import './viewmedrec.css'
import { Label } from 'reactstrap';
import { JsonToTable } from "react-json-to-table";

class ViewMedRec extends Component{

async componentDidMount(){
    await this.loadBlockChain()
    await this.loadWeb3()
    await this.loadMedRec()
    await this.loadMedRec()
    document.getElementById('nav').style.visibility = "hidden"
    
}

constructor(props){
    super(props);
    this.state={
        contract: null,
        web3: null,
        account: null,
        Medicines:'',
        Clinicaltest :'',
        Pat_Id :'',
        Pat_Name :'',
        Pat_Adr :'',
        Pat_Age :'',
        Date :'',
        Diag :'',
        Dr_name :'',
        Dr_Spec :'',
        Dr_Quali:'',
    };
  }
  async loadBlockChain(){
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    const networkData = Meme.networks[networkId]
    console.log(networkData)
    if (networkData){
      const abi = Meme.abi
      const address = networkData.address
      const contract = web3.eth.Contract(abi, address)
      this.setState({ contract })
      console.log(contract)
    }else{
      window.alert('Contarct not Deployed')
    }
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }


  async loadInfo(){
    await this.state.contract.methods.get_patid().call().then(patId =>{
        console.log(patId)
        this.setState({ patId : patId})
        document.getElementById('pat_id_l').innerHTML = patId
        document.getElementById('pat_id').innerHTML = patId
    })
    await this.state.contract.methods.getPatInfo().call().then(IpfsHash =>{
        console.log(IpfsHash)
        ipfs.cat(IpfsHash).then(data =>{
            const patinfo = JSON.parse(data)

            document.getElementById('input1').value =patinfo.name
            document.getElementById('pat_name').innerHTML =patinfo.name
            document.getElementById('adr').value = patinfo.addr
            document.getElementById('pat_adr').innerHTML = patinfo.addr
            document.getElementById('age').value = patinfo.age
            document.getElementById('pat_age').innerHTML = patinfo.age
            document.getElementById('phno').value = patinfo.phno
            document.getElementById('blood').value = patinfo.blood
            document.getElementById('height').value = patinfo.height
            document.getElementById('weight').value = patinfo.weight 
        }) 
    })
  }

  async loadMedRec(){
    await this.state.contract.methods.viewMedRec().call().then( Hash =>{
        console.log(Hash)
        ipfs.cat(Hash).then(data =>{
            const Records = JSON.parse(data)
            console.log(Records)
            
            const Dr_id = Records[0].DoctorID
            const Date = Records[0].Date
            const Diag = Records[0].Diagnosis
            const Med = Records[0].Medicines
            const CTest = Records[0].Clinicaltest
            const Foll = Records[0].Followup

            this.setState({ Medicines : Med })
            this.setState({Clinicaltest : CTest})

            document.getElementById('dr_id').innerHTML = Dr_id
            document.getElementById('rec_dr_id').innerHTML = Dr_id
            document.getElementById('date').innerHTML = Date
            document.getElementById('rec_date').innerHTML = Date
            document.getElementById('diag').innerHTML = Diag
            document.getElementById('rec_diag').innerHTML = Diag
            document.getElementById('foll').innerHTML = Foll
            document.getElementById('rec_foll').innerHTML = Foll

        })
    })
  }

  convertPdf = (event) =>{
      event.preventDefault();
      var sTable = document.getElementById('fulldetails').innerHTML;

        var style = "<style>";
        style = style + "table {width: 100%;font: 17px Calibri;}";
        style = style + "table, th, td {border: solid 1px #DDD; border-collapse: collapse;";
        style = style + "padding: 2px 3px;text-align: auto;}";
        style = style + "</style>";

        // CREATE A WINDOW OBJECT.
        var win = window.open('', '', 'height=700,width=700');

        win.document.write('<html><head>');
        win.document.write('<title>Medical Record</title>');   // <title> FOR PDF HEADER.
        win.document.write(style);          // ADD STYLE INSIDE THE HEAD TAG.
        win.document.write('</head>');
        win.document.write('<body>');
        win.document.write(sTable);         // THE TABLE CONTENTS INSIDE THE BODY TAG.
        win.document.write('</body></html>');

        win.document.close(); 	// CLOSE THE CURRENT WINDOW.

        win.print();    // PRINT THE CONTENTS.
  } 
  
    render(){
        return(
            <div>
                    <div id="pat_pri_detail_view">
                        <table >
                                <th colSpan="2">
                                    <div id="usr_ico">
                                        <img src={pat_ico} width="150" height="150" alt="pat_ico"></img>
                                    </div>
                                    <h1>Patient Details</h1>
                                </th>
                                <tr>
                                    <td>Patient id:</td>
                                    <td><label id="pat_id_l"></label></td>
                                </tr>
                                <tr>
                                    <td>Patient Name :-</td>
                                    <td><input id="input1" type="text" placeholder="FullName" readonly="readonly"></input></td>
                                </tr>
                                <tr>
                                    <td>Address :-</td>
                                    <td><textarea id="adr" type="text" placeholder="Residential Address" readonly="readonly"></textarea></td>
                                </tr>
                                <tr>
                                    <td>Age :-</td>
                                    <input class="age" id="age" type="number" placeholder="yr" readonly="readonly"></input>
                                </tr>
                                <tr>
                                    <td>Phone no :-</td>
                                    <td><input type="number" id="phno" placeholder="PatientPhoneNumber" readonly="readonly"></input></td>
                                </tr>
                                <tr>
                                    <td>BloodGroup :-</td>
                                    <td>
                                        <select id="blood" readonly="readonly">
                                            <option type="tile">Select</option>
                                            <option value="A+">A+ve</option>
                                            <option value="B+">B+ve</option>
                                            <option value="AB+">AB+ve</option>
                                            <option value="O+">O+ve</option>
                                            <option value="A-">A-ve</option>
                                            <option value="B-">B-ve</option>
                                            <option value="AB-">AB-ve</option>
                                            <option value="O-">O-ve</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Height :-</td>
                                    <input class="htwt" id="height" type="number" placeholder="in cm" readonly="readonly"></input>
                                </tr>
                                <tr>
                                    <td>Weight :-</td>
                                    <input class="htwt" id="weight" type="number" placeholder="in kg" readonly="readonly"></input>
                                </tr>
                            </table>
                        </div>
                        <br />
                        <div id="recs">
                            <table id="records" border="1">
                                <th colSpan="3"><h1>Medical Records List</h1></th>
                                <tr>
                                    <td width="7%">Sl no.</td>
                                    <td>Records</td>
                                    <td width="15%">View</td>
                                </tr>
                                <tr>
                                    <td>1.</td>
                                    <td id="det">
                                        Doctor :-<Label id="dr_id"></Label><br />
                                        Date :-<Label id="date"></Label><br />
                                        Diagnosis :- <Label id="diag"></Label><br />
                                        Medicines :- <JsonToTable json={this.state.Medicines} /><br />
                                        Recommended Clinicaltests :-<JsonToTable json={this.state.Clinicaltest} /><br />
                                        FollowUp :- <Label id="foll"></Label>
                                    </td>
                                    <td><button id="add" onClick={this.convertPdf}><img src={pdf} width="50" height="50" alt="PDF"/></button></td>
                                </tr>
                            </table>
                            <table id="fulldetails" border="2">
                                <tr>
                                    <th>Medical Records</th>
                                </tr>
                                <tr>
                                    <table border="1">
                                        <tr>
                                            <th>
                                                Patient Details
                                            </th>
                                        </tr>
                                        <tr>
                                            <td>
                                                Id :-<Label id="pat_id"></Label><br />
                                                Name :-<Label id="pat_name"></Label><br />
                                                Age :-<Label id="pat_age"></Label><br />
                                                Address :-<Label id="pat_adr"></Label>
                                            </td>
                                        </tr>
                                    </table>
                                </tr>
                                <tr>
                                    <table border="1">
                                        <tr>
                                            <th>Diagnosis</th>
                                        </tr>
                                        <tr>
                                            <td id="det">
                                                Date :-<Label id="rec_date"></Label><br />
                                                Diagnosis :- <Label id="rec_diag"></Label><br />
                                                Medicines :- <JsonToTable json={this.state.Medicines} /><br />
                                                Recommended Clinicaltests :-<JsonToTable json={this.state.Clinicaltest} /><br />
                                                FollowUp :- <Label id="rec_foll"></Label>
                                            </td>
                                        </tr>
                                    </table>
                                </tr>
                                <tr>
                                    <table border="1">
                                        <tr>
                                            <th>Doctor Details</th>
                                        </tr>
                                        <tr>
                                            <td>
                                                Id :-<Label id="rec_dr_id"></Label><br />
                                                Name :-<br />
                                                Specializations :-<br />
                                                Qualifications :-<br />
                                            </td>
                                        </tr>
                                    </table>
                                </tr>
                            </table>
                        </div>
            </div>
        )
    }
}
export default ViewMedRec;