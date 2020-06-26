import React, { Component } from 'react';
import './css/adddoc.css'
import { Link } from 'react-router-dom';
import swal from 'sweetalert';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'

class DeleteUser extends Component{
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
delUser = (event) =>{
	event.preventDefault()
	const role = document.getElementById('role').value
	const acc_id = document.getElementById('accid').value
	document.getElementById('lds').style.visibility = "visible"
	document.getElementById('delContent').style.visibility = "hidden"
	if(role==="Doctor")
	{
		this.state.contract.methods.delDr(acc_id).send({from: this.state.account}).on("confirmation", (r) => {
			swal({
				title: "Success",
				text: "Doctor removed successfully",
				icon: "success",
				button: {
					text:"ok",
				  }
			});
			document.getElementById('lds').style.visibility = "hidden"
			window.location.reload();
		}).on("error",(er)=>{
			swal({
				title: "Success",
				text: "Doctor id doesn't Exist",
				icon: "error",
				button: {
					text:"ok",
				  }
			});
			document.getElementById('lds').style.visibility = "hidden"
			window.location.reload();
		});
	}
	else if(role === "Patient"){
		this.state.contract.methods.delPat(acc_id).send({from: this.state.account}).on("confirmation", (r) => {
			swal({
				title: "Success",
				text: "Patient removed successfully",
				icon: "success",
				button: {
					text:"ok",
				  }
			});
			document.getElementById('lds').style.visibility = "hidden"
			window.location.reload();
		}).on("error",(er)=>{
			swal({
				title: "Success",
				text: "Patient id doesn't Exist",
				icon: "error",
				button: {
					text:"ok",
				  }
			});
			document.getElementById('lds').style.visibility = "hidden"
			window.location.reload();
		});
	}
	else{
		window.alert("RollName must be 'Doctor/Patient'")
		document.getElementById('lds').style.visibility = "hidden"
		window.location.reload()
	}
	
}
render(){
    return(
        <div id="deleteuser">

			<Link id="go_back" to="/admin"><i class="fa fa-university">&nbsp;Home</i></Link>
            <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div>
			<div id="delContent">
                <h1 style={{"color":"#b53604",fontSize:"46px"}}><i class="fa fa-user-times"></i>&nbsp;&nbsp;Delete User</h1>
					<div class="modal-dialog modal-dialog-centered"  >
						<div class="modal-content">
							<div class="modal-header">
									<h2  style={{"textAlign":"center"}}>Delete User from the System</h2>						
							</div>
						<div class="modal-body" style={{"paddingBottom":"50px"}}>
						<form>
							<div class="row form-row">
							<div class="form-group">
	          					<div class="select-wrap">
								<select name="" id="role" class="form-control">
									<option value="">Select user type</option>
									<option value="Doctor">Doctor</option>
									<option value="Patient">Patient</option>
								</select>
	                    		</div>
			              	</div>
							<div class="col-12">
							<div class="form-group">
							    <label>User Id</label>
							<div class="cal-icon">
								<input id="accid" type="text" class="form-control" placeholder="user account id"/>
							</div>
						</div>
					</div>      
					</div>
						<button type="submit" id="btn" class="btn btn-primary" onClick={this.delUser}
                            style={{padding:"10px",paddingLeft:"20px",paddingRight:"20px"}}>
                                Delete User</button>
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

export default DeleteUser;