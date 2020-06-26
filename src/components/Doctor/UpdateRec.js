import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import '../css/patrec.css'
import pat_ico from '../images/pat_ico.png';
import backico from '../images/back.png';
import rx from '../images/Rx.png'
import add_ico from '../images/add_ico.png'
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import ipfs from '../ipfs';
import { Label } from 'reactstrap';
import $ from 'jquery';

class UpdateRec extends Component{

    async componentDidMount(){
        await this.loadBlockChain()
        await this.loadWeb3()
        await this.loadInfo()
        await this.loadTime()
    }

    constructor(props){
        super(props);
        this.state={
            contract: null,
            web3: null,
            account: null,
            pat_Id:'',
            IpfsHash : '',
            sl : 1,
            Sl_test : 1,
            date : '',
            month : '',
            year : '',
            Hour : '',
            Minutes :'',
            Sec : '',
            Date : '',
            Time : ''
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
            this.setState({ pat_Id : patId})
            document.getElementById('pat_id_l').innerHTML = patId
        })
        await this.state.contract.methods.getPatInfo().call().then(IpfsHash =>{
            console.log(IpfsHash)
            ipfs.cat(IpfsHash).then(data =>{
                const patinfo = JSON.parse(data)

                document.getElementById('input1').value =patinfo.name
                document.getElementById('adr').value = patinfo.addr
                document.getElementById('age').value = patinfo.age
                document.getElementById('phno').value = patinfo.phno
                document.getElementById('blood').value = patinfo.blood
                document.getElementById('height').value = patinfo.height
                document.getElementById('weight').value = patinfo.weight 
            }) 
        })

        await this.state.contract.methods.getDr(this.state.account).call().then(
            Drinfo =>{
                ipfs.cat(Drinfo).then(data =>{
                    console.log(data)
                    var info = JSON.parse(data)
                    document.getElementById('dname').innerHTML = "&nbsp;&nbsp;"+info.Name
                    document.getElementById('dqual').innerHTML = "&nbsp;&nbsp;"+info.Quali
                    document.getElementById('drspec').innerHTML = "&nbsp;&nbsp;"+info.Spec
                })
            }
        )
      }

      async loadTime(){
            const d = new Date();
            this.setState({ month : d.getMonth() + 1 })
            this.setState({ year : d.getFullYear() })
            this.setState({ time : d.getTime() })
            this.setState({ date : d.getDate()})
            this.setState({ Hour : d.getHours() % 12 || 12 });
            this.setState({ Minutes : d.getMinutes()});
            this.setState({ Sec : d.getSeconds()})
            
            const Dates = this.state.date+"/"+this.state.month +"/"+this.state.year
            const Times = this.state.Hour+":"+this.state.Minutes+":"+this.state.Sec

            this.setState({ Date : Dates})
            this.setState({Time : Times})
      }

    addRow = (event) =>{
        
        var Brand_name = document.getElementById('med1').value
        var Dosage = document.getElementById('med2').value
        var Freq = document.getElementById('med3').value
        var Noday = document.getElementById('med4').value
        var Remarks = document.getElementById('remark').value
        
         
        var table = document.getElementById('medicines_table').insertRow(this.state.sl)
        var sl = table.insertCell(0);
        var bn = table.insertCell(1);
        var dos = table.insertCell(2);
        var fre = table.insertCell(3);
        var nod = table.insertCell(4)
        var rem = table.insertCell(5);

        sl.innerHTML = this.state.sl
        bn.innerHTML = Brand_name
        dos.innerHTML = Dosage
        fre.innerHTML = Freq
        nod.innerHTML = Noday
        rem.innerHTML = Remarks
        this.setState({ sl : this.state.sl + 1 })

        document.getElementById('med1').value = ""
        document.getElementById('med2').value = ""
        document.getElementById('med3').value = ""
        document.getElementById('med4').value = ""
        document.getElementById('remark').value = ""
         
    }

    addtest = (event) => {
        event.preventDefault()
        var tests = document.getElementById('clinicaltest').value
        var rectest = document.getElementById('rec_test').insertRow(this.state.Sl_test)
        var Sl = rectest.insertCell(0);
        var test = rectest.insertCell(1);

        Sl.innerHTML = this.state.Sl_test
        test.innerHTML = tests

        this.setState({ Sl_test : this.state.Sl_test + 1 })
    }
    
    saveInfo = async (event) =>{
        event.preventDefault()
        
        var Medicines = []
        var ClinicalTest = []
    
        $('#medicines_table tr').each(function(row, tr){
        Medicines[row]={
            "sl" : $(tr).find('td:eq(0)').text()
            , "Brandname" :$(tr).find('td:eq(1)').text()
            , "Dosage" : $(tr).find('td:eq(2)').text()
            , "Frequency" : $(tr).find('td:eq(3)').text()
            , "No.of Days" : $(tr).find('td:eq(4)').text()
            ,"Remarks" : $(tr).find('td:eq(5)').text()
        }
        }); 
        Medicines.shift();

        $('#rec_test tr').each(function(row, tr){
            ClinicalTest[row]={
                "Sl" : $(tr).find('td:eq(0)').text()
                , "Clinical test" :$(tr).find('td:eq(1)').text()
            }
            }); 
            ClinicalTest.shift();

        var FollowUp = document.getElementById('followup').value
        var Diagnosis = document.getElementById('diagno_text').value


        var MedRecord = [
            {
                "DoctorID" : this.state.account,
                "PatientID":  this.state.pat_Id,
                "Date" : this.state.Date,
                "Time" : this.state.Time,
                "Diagnosis" : Diagnosis,
                "Medicines" : Medicines,
                "Clinicaltest" : ClinicalTest,
                "Followup" : FollowUp
            }
        ]
        console.log(MedRecord)
        const rec = JSON.stringify(MedRecord)
        await ipfs.add(rec).then(hasH =>{
            console.log(hasH)
            this.state.contract.methods.addMedRecord(hasH,this.state.pat_Id).send({from: this.state.account}).on("confirnation",(e)=>{
                window.alert("Patient Recorded Successfully")
            })
        })
    }
    
    render() {
        return (
                <div id="pat_body">
                    <div id="g_back">          
                        <Link  to="/AddPatientRec"><img src={backico} width="40" height="30" alt="backimg"></img>Back</Link>
                    </div>
                    <button id="save" onClick={this.saveInfo}>Save All</button>
                    
                        <br />
                        <div id="pat_pri_detail">
                            <table>
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

                        <div id="diagno">
                            <table>
                                <th colSpan="2"><h2>Diagnosis</h2></th>
                                <tr>
                                    <td>Doctor id:-&nbsp;&nbsp;<b>{this.state.account}</b></td>
                                    <td><p id="dr_id"></p></td>
                                </tr>
                                <tr>
                                    <td>
                                        prescribtion date :- &nbsp;{this.state.Date}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        prescribtion time :- &nbsp;{this.state.Time} sec
                                    </td>
                                </tr>
                                <tr>
                                    <div id="diagnosis">
                                        <table>
                                            <th>Descriptions :-</th>
                                            <tr>
                                                <td><textarea id="diagno_text"></textarea></td>
                                            </tr>
                                        </table>
                                    </div>
                                </tr>
                                <tr>
                                    <img src={rx} width="40" height="35" alt="Rx"></img>
                                    <div id="medicines">
                                        <table border="1" id="medicines_table">
                                            <tr>
                                                <td width="4%">Sl.</td>
                                                <td width="40%">Brand Name</td>
                                                <td width="12%">Dosage</td>
                                                <td width="12%">Frequency</td>
                                                <td width="12%">No.of Days</td>
                                                <td width="20%">Remarks</td>
                                            </tr>
                                            
                                        </table>
                                        <form >
                                        <table  id="tr">
                                            <tr>
                                                <td width="4%"><p id="sl">{this.state.sl}</p></td>
                                                <td><input id="med1" type="text" placeholder="Medicine Name" name="med_name" required="required"></input></td>
                                                <td><input id="med2" type="number" placeholder="Dosage" name="dos" required="required"></input></td>
                                                <td>
                                                    <select id="med3" name="freq" >
                                                        <option value="">Frequency</option>
                                                        <option value="1-1-1">1-1-1</option>
                                                        <option value="1-1-0">1-1-0</option>
                                                        <option value="1-0-1">1-0-1</option>
                                                        <option value="1-0-0">1-0-0</option>
                                                        <option value="0-1-1">0-1-1</option>
                                                        <option value="0-1-0">0-1-0</option>
                                                        <option value="0-0-1">0-0-1</option>
                                                    </select>
                                                </td>
                                                <td><input id="med4" type="number" placeholder="No.of Days" name="nod" required="required"></input></td>
                                                <td><input id="remark" type="text" placeholder="Remarks" name="rem"></input></td>
                                                <td>
                                                    <button type="submit" id="add" onClick={this.addRow} ><img id="addbtn" src={add_ico} width="25" height="25" alt="Add"></img></button>
                                                </td>
                                            </tr>
                                        </table>
                                        </form>
                                    </div>
                                </tr>
                                <tr>
                                    <p id="rectest"><u><b>Recommended Clinical test</b></u>
                                     <br />
                                        <table id="rec_test">
                                            <tr>
                                                <td>Sl.&nbsp;&nbsp;</td>
                                                <td id="ctest">Clinical tests</td>
                                            </tr>
                                        </table>
                                        <table>
                                            <tr>
                                                <td>
                                                    <select id="clinicaltest">
                                                        <option>Select Test</option>
                                                        <option value="Chest X-Ray">Chest X-Ray</option>
                                                        <option value="CT Scan - Thorasic">CT Scan - Thorasic</option>
                                                        <option value="Urinalysis">Urinalysis</option>
                                                        <option value="Hemoglobin A1C">Hemoglobin A1C</option>
                                                        <option value="Complete Blood Count">Complete Blood Count</option>
                                                        <option value="Electrocardiogram">Electrocardiogram</option>
                                                        <option value="Coagulation Tests">Coagulation Tests</option>
                                                        <option value="Autoantibodies">Autoantibodies</option>
                                                        <option value="Electroencephalogram">Electroencephalogram</option>
                                                        <option value="Arthroscopy">Arthroscopy</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button id="add" onClick={this.addtest}><img src={add_ico} width="25" height="25" alt="Add"></img></button>
                                                </td>
                                            </tr>
                                        </table>
                                     
                                    </p>
                                </tr>
                                <tr>
                                    <p><u><b>Follw up</b></u>
                                    <br />
                                        <select id="followup">
                                            <option>select</option>
                                            <option value="After 1 Weeks">After 1 Week / SOS</option>
                                            <option value="After 2 Weeks">After 2 Week / SOS</option>
                                            <option value="After 3 Weeks">After 3 Week / SOS</option>
                                            <option value="After 1 month">After 1 Month / SOS</option>
                                        </select>
                                    </p>
                                </tr>
                                <div id="drinformation">
                                    Doctor Informations
                                    <tr>
                                        <p id="drid">
                                            Doctor id :-&nbsp;&nbsp;{this.state.account}
                                            <br />
                                            Doctor Name :-<Label id="dname"></Label>
                                            <br />
                                            Specialization :-<Label id="drspec"></Label>
                                            <br />
                                            Doctor Qualification :-<Label id="dqual"></Label>
                                        </p>
                                    </tr>
                                </div>
                            </table>
                            <div id="footer">
                                <footer>EHR-BlockChain</footer>
                            </div>
                        </div> 
                </div>
        )
    }

}

export default UpdateRec;