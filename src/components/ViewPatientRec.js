import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { MDBCol, MDBIcon,MDBInput} from "mdbreact";
import Web3 from 'web3'
import Meme from '../abis/Contract.json'
import history from './history'
import srchico from './images/search_ico.png'
import ipfs from './ipfs'


class ViewPatientRec extends Component {


    constructor(props){
        super(props)
        this.state={
            search : '',
            contract: null,
            web3: null,
            account: null,
        }
    }
    async componentDidMount(){
      document.getElementById('nav').style.visibility = "hidden"
        await this.loadBlockChain()
        await this.loadWeb3()
        await this.loadInfo()
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

    /*searchInfo = async (event) =>{
        event.preventDefault()
        const search = document.getElementById('bar').value
        console.log(search)
        document.getElementById('lds').style.visibility = "visible"
        await this.state.contract.methods.viewPatRec(search).send({from : this.state.account})
        .on("confirmation" ,(e)=>{
            document.getElementById('lds').style.visibility = "hidden"
            history.push('/MedicalRecords')
        }).on("error",(err)=>{
            window.alert("")
            document.getElementById('lds').style.visibility = "hidden"
        })
    }*/
    async loadInfo(){
      await this.state.contract.methods.get_patid().call().then(patId =>{
          console.log(this.state.account)
          this.setState({ patId : this.state.account })
          //document.getElementById('pat_id_l').innerHTML = patId
         // document.getElementById('pat_id').innerHTML = patId
      })
      await this.state.contract.methods.getPatInfo(this.state.account).call()
      .then(rechash =>{
  
          console.log(rechash)
          ipfs.cat(rechash).then(data =>{
              const patinfo = JSON.parse(data)
              console.log(patinfo)
  
             /* document.getElementById('input1').value =patinfo.name
              document.getElementById('pat_name').innerHTML =patinfo.name
              document.getElementById('adr').value = patinfo.addr
              document.getElementById('pat_adr').innerHTML = patinfo.addr
              document.getElementById('age').value = patinfo.age
              document.getElementById('pat_age').innerHTML = patinfo.age
              document.getElementById('phno').value = patinfo.phno
              document.getElementById('blood').value = patinfo.blood
              document.getElementById('height').value = patinfo.height
              document.getElementById('weight').value = patinfo.weight */
 
          }) 
        })
    }


render ()  {
    return (
        <div id="viewInfo">
                <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
                
                <h1 id="h1">Patient Medical Records</h1>
                <div id="searchbar">
                    <center>
                        <MDBCol md="6">
                            <MDBIcon icon="search" />
                            <MDBInput 
                                id="bar" 
                                type="text" 
                                hint="Enter the Account id of the Patient (0x7aF32124e1Df4c17000Df10.....)" 
                                >
                            </MDBInput>
                            <button id="srch_btn" onClick={this.searchInfo}><img src={srchico} alt="SERACH" /></button>
                        </MDBCol>
                    </center>
                </div>
                <div id="">
                <div class="row">
						<div class="col-sm-12">
              <center>
							<div class="card" style={{width:"85%"}}>
								<div class="card-header">
									<h4 class="card-title" style={{fontSize: "1.5rem",fontFamily:"'Mada', sans-serif",fontWeight:"bold"}}>
                    Medical Records</h4>
								</div>
								<div class="card-body">
									<div class="table-responsive" >
										<table class="datatable table table-stripped">
											<thead>
												<tr>
													<th>#</th>
													<th>Date &amp; Time</th>
													<th>Doctor</th>
													<th>Category</th>
                          <th>Actions</th>
													<th>Print</th>
												</tr>
											</thead>
											<tbody>
											</tbody>
										</table>
									</div>
								</div>
							</div>
              </center>
						</div>
					</div>
                </div>
            </div>
            )
        }
}

export default ViewPatientRec;