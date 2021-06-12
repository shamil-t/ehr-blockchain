import React, { Component } from 'react';
import './css/adddoc.css'
import { Link } from 'react-router-dom';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import ipfs from '../ipfs'
import swal from 'sweetalert';


class AddDocter extends Component{

    componentDidMount(){
        document.getElementById('nav').style.visibility = "hidden"
        this.loadBlockChain()
        this.loadWeb3()
      } 
    
      constructor(props){
        super(props);
        this.state={
          contract: null,
          web3: null,
          account: null,
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
     addUser = async (event) => {

             event.preventDefault()
             document.getElementById('lds').style.visibility = "visible"
             document.getElementById('docContent').style.visibility = "hidden"
             const fname = document.getElementById('fname').value
             const lname = document.getElementById('lname').value
             const email = document.getElementById('email').value
             const dob = document.getElementById('dob').value
             const mobile = document.getElementById('mob').value
             const accId = document.getElementById('accid').value.trim()
             const city = document.getElementById('city').value
             const state = document.getElementById('state').value
             const speciality = document.getElementById('spec').value

             var DrInfo = {
                 "Fname":fname,
                 "Lname":lname,
                 "Email":email,
                 "Dob":dob,
                 "Mobile":mobile,
                 "Accid":accId,
                 "City":city,
                 "State":state,
                 "Speciality":speciality
             }
             console.log(DrInfo)
             
             var InfoStr = JSON.stringify(DrInfo)
             await ipfs.add(InfoStr).then(
                 hash => {
                     console.log(hash)
                    this.state.contract.methods.addDrInfo(accId,hash).send({from: this.state.account})
                    .on("confirmation", (r) => {
                        console.log("Doctor Added Successfully")
                        swal({
                            title: "Success",
                            text: "Doctor Registerd Successfully",
                            icon: "success",
                            button: "ok",
                        });
                        document.getElementById('lds').style.visibility = "hidden"
                        window.location.reload();
                    }).on("error",(er)=>{
                        swal({
                            title: "Error",
                            text: "1.Only Admin can Add Users\n2.This id Already have a role",
                            icon: "error",
                            button: "ok",
                        });
                        document.getElementById('lds').style.visibility = "hidden"
                        window.location.reload();
                    });
                 });
    }


render(){
    return(
        <div id="adddoc" style={{"display":"block","paddingBottom":"50px"}}>
            <Link id="go_back" to="/admin"><i class="fa fa-university">&nbsp;Home</i></Link>
            <center>
            <div id="lds"><div></div><div></div><div></div><div></div><div></div></div>
                <h1 style={{"color":"#d609a6",fontSize:"48px"}}><i class="fa fa-user-plus"></i>&nbsp;&nbsp;Add a Doctor</h1>
                <div id="docContent">
					<div class="modal-dialog modal-dialog-centered"  >
						<div class="modal-content">
							<div class="modal-header">
									<h2  style={{"textAlign":"center"}}>Doctor Details</h2>
															
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
													<div class="form-group">
														<label>Doctor Id</label>
														<input id="accid" type="text" class="form-control" placeholder="doctor account id"/>
													</div>
												</div>
												<div class="col-12 col-sm-6">
													<div class="form-group">
														<label>City</label>
														<input id="city" type="text" class="form-control" placeholder="city"/>
												</div>					
												</div>
                                                <div class="col-12 col-sm-6">
													<div class="form-group">
														<label>State</label>
														<input id="state" type="text" class="form-control" placeholder="state"/>
													</div>
												</div>
                                                <div class="col-12 col-sm-6">
													<div class="form-group">
														<label>Speciality</label>
														<input id="spec" type="text" class="form-control" placeholder="specialties"/>
													</div>
												</div>
											</div>
												<button type="submit" id="btn" class="btn btn-primary" onClick={this.addUser}
                                                style={{padding:"10px",paddingLeft:"20px",paddingRight:"20px"}}>
                                                    Add Doctor</button>
									</form>
								</div>
							</div>
						</div>
				</div>											
            </center>
		</div>
    );
    
}
}

export default AddDocter;