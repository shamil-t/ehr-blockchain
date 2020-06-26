import React, { Component} from 'react';
import '../css/patrec.css'
import '../css/addpatrec.css';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import history from '../history';
import { Link } from 'react-router-dom';
import swal from 'sweetalert';
import $ from 'jquery'
import ipfs from '../ipfs'


class AddPatientRec extends Component {

    async componentWillMount(){
        
        await this.loadWeb3()
        await this.loadBlockChain()
        await this.loadTime()
        this.checkDoctor()
        $("#medicines_table").on('click','.btn',function(){
          $(this).parent().parent().remove();
         
          })
           $("#clinicTest").on('click','.btn',function(){
          $(this).parent().parent().remove();
         
          })
     }
    
     async loadBlockChain(){ 
       const web3 = window.web3
       const accounts = await web3.eth.getAccounts()
       this.setState({ account: accounts[0] })
       const networkId = await web3.eth.net.getId()
       const networkData = Meme.networks[networkId]
       if (networkData){
         const abi = Meme.abi
         const address = networkData.address
         const contract = web3.eth.Contract(abi, address)
         this.setState({ contract })
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
       }document.getElementById('nav').style.visibility = "hidden"
     }


     constructor(props){
       super(props);
       this.state={
         memeHash: '',
         contract: null,
         web3: null,
         buffer: null,
         account: null,
         result:'',
         sl : 1,
         pat_Id : '',
         date : '',
         month : '',
         year : '',
         Hour : '',
         Minutes :'',
         Sec : '',
         Date : '',
         Time : ''
       };
       this.state = {isDoctor : false }
       this.state = {isPatient : false}
       this.state = { sl : 1}
       this.state = { test : 1}
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

     async checkDoctor(){
        document.getElementById('lds').style.visibility = "visible"
        try {
          const  result = await this.state.contract.methods.isDr(this.state.account).call()
        console.log(result)
        if(result=== "1"){
          this.setState({isDoctor : true})
          document.getElementById('lds').style.visibility ="hidden"
        }
        else{
          document.getElementById('lds').style.visibility ="hidden"
          swal({
            title: "Acess Deneid",
            text: "Only Doctor have acess to this page",
            icon: "error",
            button: {
                    text:"go back",
                    value:"back"
                  }
          }).then((value)=>{
            history.push("/home")
          })
        }
        } catch (error) {
          swal({
            title: "Acess Deneid",
            text: "Only Doctor have acess to this page",
            icon: "error",
            button: {
                    text:"go back",
                    value:"back"
                  }
          }).then((value)=>{
            history.push("/home")
          })
        }
        
     }

     isPatient = async (event) => {
      event.preventDefault()
      document.getElementById('lds').style.visibility = "visible"
      const iD = document.getElementById('accid').value
      this.setState({pat_Id : iD})
      try {
        const  result = await this.state.contract.methods.isPat(iD).call()
        console.log(result)
        if(result=== "1"){
          this.setState({isPatient : true})
          document.getElementById('lds').style.visibility ="hidden"
          document.getElementById('content').style.visibility = "hidden"
          this.setState({sl : 1})
        }
        else{
          document.getElementById('lds').style.visibility ="hidden"
          swal({
            title: "Not a Patient id",
            text: "The patient id is not Present",
            icon: "error",
            button: {
                    text:"go back",
                    value:"back"
                  }
          }).then((value)=>{
            history.push("/AddPatientRec")
          })
        }
      } catch (error) {
        swal({
          title: "Only for Doctors",
          text: "This page is only for Doctors ",
          icon: "error",
          button: {
                  text:"go back",
                  value:"back"
                }
        }).then((value)=>{
          history.push("/home")
        })
      }
      
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
      var delbtn = table.insertCell(6);

      sl.innerHTML = this.state.sl
      bn.innerHTML = Brand_name
      dos.innerHTML = Dosage
      fre.innerHTML = Freq
      nod.innerHTML = Noday
      rem.innerHTML = Remarks
      delbtn.innerHTML = delbtn.innerHTML + "<button onlick={this.delRow} class='btn btn-sm bg-danger-light' data-toggle='modal' href='#delete_modal' style={{backgroundColor:'rgba(242, 17, 54,0.12)',color:'#e63c3c',fontSize:'.875rem'}}><i class='fe fe-trash'></i> Delete</button>"
     
      this.setState({ sl : this.state.sl + 1 })

      document.getElementById('med1').value = ""
      document.getElementById('med2').value = ""
      document.getElementById('med3').value = ""
      document.getElementById('med4').value = ""
      document.getElementById('remark').value = "" 
  }

  addTest = (event) => {
        event.preventDefault()

        var test = document.getElementById('clinicaltest').value
        var tableTest = document.getElementById('clinicTest').insertRow(this.state.test)

        var sl1 = tableTest.insertCell(0)
        var tests = tableTest.insertCell(1)
        var delbtn = tableTest.insertCell(2);

        sl1.innerHTML = this.state.test
        tests.innerHTML = test
        delbtn.innerHTML = delbtn.innerHTML + "<button onlick={this.delRow} class='btn btn-sm bg-danger-light' data-toggle='modal' href='#delete_modal' style={{backgroundColor:'rgba(242, 17, 54,0.12)',color:'#e63c3c',fontSize:'.875rem'}}><i class='fe fe-trash'></i> Delete</button>"

        this.setState({test : this.state.test + 1})

        document.getElementById('clinicaltest').value = ""
  }

  saveAll = async (event) =>{
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

      $('#clinicTest tr').each(function(row, tr){
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

      const rec = JSON.stringify(MedRecord)
      console.log(rec)
      await ipfs.add(rec).then(hasH =>{
        console.log("IPFS HASH :-"+hasH)
        this.state.contract.methods.addMedRecord(hasH,this.state.pat_Id).send({from: this.state.account}).on("confirnation",(e)=>{
          swal({
            title: "Successfull",
            text: "Medical record Submitted Successfully",
            icon: "success",
            button: {
                    text:"Go back",
                    value:"back"
                  }
          }).then((value)=>{
            history.push("/AddPatientRec")
          })
        })
    })
  } 



render ()  {
  const isDoctor = this.state.isDoctor
  const isPatient = this.state.isPatient
  const sl = this.state.sl
    return (
        <div id="body">
          <Link id="go_back" to="/home"><i class="fa fa-university">&nbsp;Home</i></Link>
          <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
          {isDoctor
          ?
            <div id="content"> 
            <div id="rec_box">
                <table border="0">
                  <thead>
                    <th colSpan="3"><h1 id="h1">Add Patient Record</h1></th>
                  </thead>
                    <tbody>
                      <tr>
                      
                          <td>Patient id :-</td>
                          <td colSpan="3"><div>
                            <input id="accid" class="from-control" type="text" placeholder="Account id(eg:-0x5123ee664cdf45DAD30e67Ccbf51E1E66DC65596)">
                            </input>
                          </div>
                          </td>
                      </tr>
                      <tr>
                          <td colSpan="3"><center><button class="btn btn-primary" onClick={this.isPatient} style={{borderRadius:"10px"}}>
                            Add Record&nbsp;&nbsp;<i class="fa fa-arrow-right"></i>
                          </button></center></td>
                      </tr>
                    </tbody>
                </table>
            </div>
            </div>
          :  <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
          }
          {isPatient
            ?<div id="pat_body">
            
            <div id="docContent" >
					<div class="modal-dialog modal-dialog-centered" style={{maxWidth:"880px"}} >
						<div class="modal-content" >
							<div class="modal-header">
									<h2  style={{"textAlign":"center"}}>Patient Medical Record</h2>		
							</div>
						<div class="modal-body" style={{"paddingBottom":"50px"}}>
						<form>
							<div class="row form-row">
								<div class="col-12 col-sm-6">
									<div class="form-group">
										<label>First Name</label>
										<input id="fname" type="text" class="form-control"  placeholder="first name"/>
									</div>
								</div>
							<div class="col-12 col-sm-6">
								<div class="form-group">
										<label>Last Name</label>
										<input id="lname" type="text"  class="form-control" placeholder="last name"/>
								</div>
							</div>
							<div class="col-12">
							<div class="form-group">
							    <label>Date of Birth</label>
							<div class="cal-icon">
								<input id="dob" type="text" class="form-control" placeholder="date of birth"/>
							</div>
						</div>
					</div>
					<div class="col-12 col-sm-6">
						<div class="form-group">
							<label>Email ID</label>
								<input id="email" type="email" class="form-control" placeholder="email address"/>
									</div>
										</div>
											<div class="col-12 col-sm-6">
												<div class="form-group">
													<label>Mobile</label>
													<input id="mob" type="text"  class="form-control" placeholder="mobile"/>
												</div>
											</div>
											<div class="col-12">
														<h4 class="form-title"><span>Medical Record</span></h4>
											</div>
												<div class="col-12">
													<div class="form-group">
														<label>Daignosis<br/> Rx</label>
														<textarea id="diagno_text" type="text" class="diagno" placeholder="Doctor's Daignosis" style={{height:"168px"}}/>
													</div>
												</div>
												<div class="col-12 col-sm-6">
													<div class="form-group">
														<label>Medications</label>

												<div class="col-lg-6">
                            <div class="cards" style={{marginBottom:"45px"}}>
                                  <table id="medicines_table" class="table table-nowrap mb-0" style={{width:"680px"}}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Brand Name</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>no.of Days</th>
                                        <th>Remarks</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                  </table>
                            </div>
						            </div>

                        <div class="col-lg-6">
                            <div class="cards" style={{marginBottom:"45px"}}>
                                  <table class="table table-nowrap mb-0" style={{width:"720px"}}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Brand Name</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>no.of Days</th>
                                        <th>Remarks</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>{sl}</td>
                                        <td><input id="med1" type="text" required></input></td>
                                        <td>
                                          <input id="med2" type="number" placeholder="Dosage" name="dos"/>
                                        </td>
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
                                        <td>
                                          <input id="med4" type="number" placeholder="No.of Days" name="nod" ></input>
                                        </td>
                                        <td><input id="remark" type="text"></input></td>
                                        <td>
                                          <button class="btn btn-primary" onClick={this.addRow}>
                                            <i class="fa fa-plus"></i>&nbsp;Add
                                          </button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                            </div>
						            </div>

                        <div class="col-12">
														<h4 class="form-title"><span>Recommended Clinical Test</span></h4>
											  </div>
                        <div class="col-lg-6">
                            <div class="cards" style={{marginBottom:"45px"}}>
                                  <table id="clinicTest" class="table table-nowrap mb-0" style={{width:"350px"}}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Clinical Test</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>

                                    </tbody>
                                  </table>
                            </div>
                          </div>

                          <div class="col-lg-6">
                            <div class="cards" style={{marginBottom:"45px"}}>
                                  <table class="table table-nowrap mb-0" >
                                    <thead>
                                      
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>{sl}</td>
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
                                          <button class="btn btn-primary" onClick={this.addTest}>
                                            <i class="fa fa-plus"></i>&nbsp;Add
                                          </button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                            </div>
                          </div>

                        <div class="col-12">
													<h4 class="form-title"><span>Follow up</span></h4>
											  </div>
                        <div class="col-lg-6">
                            <div class="cards" style={{marginBottom:"45px"}}>
                                  <table class="table table-nowrap mb-0" >
                                    <tbody>
                                      <tr>
                                        <select id="followup">
                                        <option>Select</option>
                                        <option value="After 1 Weeks">After 1 Week / SOS</option>
                                        <option value="After 2 Weeks">After 2 Week / SOS</option>
                                        <option value="After 3 Weeks">After 3 Week / SOS</option>
                                        <option value="After 1 month">After 1 Month / SOS</option>
                                      </select>
                                      </tr>
                                    </tbody>
                                  </table>
                            </div>
                          </div>

												</div>					
												</div>
											</div>
												<button type="submit" id="btn" class="btn btn-primary" onClick={this.saveAll}
                                style={{padding:"5px",paddingLeft:"10px",paddingRight:"10px",float:"right",marginRight:"50px",marginTop:"35px",fontSize:"18px",borderRadius:"8px"}}>
                                save</button>
									</form>
								</div>
							</div>
						</div>

            </div>
        </div>
            :<div></div>
          }
            </div>
            )
        }
}

export default AddPatientRec;