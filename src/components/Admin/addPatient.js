import React, { Component } from 'react';
import './css/adddoc.css'
import { Link } from 'react-router-dom';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import ipfs from '../ipfs'
import swal from 'sweetalert';

class Addpatient extends Component{

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
             document.getElementById('patContent').style.visibility = "hidden"
             const fname = document.getElementById('fname').value
             const lname = document.getElementById('lname').value
             const email = document.getElementById('email').value
             const mobile = document.getElementById('mob').value
             const accId = document.getElementById('accid').value

             var DrInfo = {
                 "Fname":fname,
                 "Lname":lname,
                 "Email":email,
                 "Mobile":mobile,
                 "Accid":accId,
             }
             console.log(DrInfo)
             
             var InfoStr = JSON.stringify(DrInfo)
             await ipfs.add(InfoStr).then(
                 hash => {
                     console.log(hash)
                    this.state.contract.methods.addPatInfo(accId,hash).send({from: this.state.account})
                    .on("confirmation", (r) => {
                        console.log("Doctor Added Successfully")
                        swal({
                            title: "Success",
							text: "Acess granted to Patient",
                            icon: "success",
                            button: {
								text:"ok",
								
							  }
                        });
                        document.getElementById('lds').style.visibility = "hidden"
                        window.location.reload();
                    }).on("error",(er)=>{
                        swal({
                            title: "Error",
                            text: "This id Already have a role",
                            icon: "error",
                            button: {
								text:"ok",
							  }
                        });
                        document.getElementById('lds').style.visibility = "hidden"
                        window.location.reload();
                    });
                 });
    }

render(){

    return(
        <div id="addpatient">
			<Link id="go_back" to="/admin"><i class="fa fa-university">&nbsp;Home</i></Link>
            <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div>
			<div id="patContent">
                <h1 style={{"color":"#b53604",fontSize:"46px"}}><i class="fa fa-user-plus"></i>&nbsp;&nbsp;Add a Patient</h1>
					<div class="modal-dialog modal-dialog-centered"  >
						<div class="modal-content">
							<div class="modal-header">
									<h2  style={{"textAlign":"center"}}>Grant Acess to a Patient</h2>
															
							</div>
						<div class="modal-body" >
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
							    <label>Patient Id</label>
							<div class="cal-icon">
								<input id="accid" type="text" class="form-control" placeholder="patient account id"/>
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
											
                                                
											</div>
												<button type="submit" id="btn" class="btn btn-primary" onClick={this.addUser}
                                                style={{padding:"10px",paddingLeft:"20px",paddingRight:"20px"}}>
                                                    Grant Permission</button>
									</form>
								</div>
							</div>
						</div>
						</div>													
            </center>
        </div>
    )
}

}

export default Addpatient;