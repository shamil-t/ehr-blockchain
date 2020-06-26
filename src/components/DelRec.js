import React, { Component } from 'react';
import './css/Addusr.css';
import './css/addpatrec.css';
import './css/delusr.css'
import Web3 from 'web3'
import Meme from '../abis/Contract.json'
import { Link } from 'react-router-dom';
import backico from './images/back.png';


class DelRec extends Component {

    async componentWillMount(){
        await this.loadWeb3()
        await this.loadBlockChain()
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
   
     constructor(props){
       super(props);
       this.state={
         memeHash: '',
         contract: null,
         web3: null,
         buffer: null,
         account: null,
         result:''
       };
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
        const acc_id = document.getElementById('acc_id').value
        document.getElementById('lds').style.visibility = "visible"
        if(role==="Doctor")
        {
            this.state.contract.methods.delDr(acc_id).send({from: this.state.account}).on("confirmation", (r) => {
                window.alert("Doctor Deleted")
                document.getElementById('lds').style.visibility = "hidden"
            }).on("error",(er)=>{
                window.alert("User doesn't Exist")
                document.getElementById('lds').style.visibility = "hidden"
            });
        }
        else if(role === "Patient"){
            this.state.contract.methods.delPat(acc_id).send({from: this.state.account}).on("confirmation", (r) => {
                window.alert("Patient Deleted")
                document.getElementById('lds').style.visibility = "hidden"
            }).on("error",(er)=>{
                window.alert("User doesn't Exist")
                document.getElementById('lds').style.visibility = "hidden"
            });
        }
        else{
            window.alert("RollName must be 'Doctor/Patient'")
            document.getElementById('lds').style.visibility = "hidden"
        }
        
    }

render ()  {
    return (
        <div id="body">
            <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
            <div id="content_del"> 
            <div id="g_back">          
                <Link  to="/"><img src={backico} width="40" height="30" alt="backimg"></img>Home</Link>
            </div>
            <div id="rec_box">
                <table border="0">
                    <th colSpan="3"><h1 id="h1">Delete User</h1></th>
                    <tr>
                        <td>User is a :-</td>
                        <td>
                            <select id="role">
                                <option>Select User</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Patient">Patient</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>User id :-</td>
                        <td colSpan="3"><div><input id="acc_id"  type="text" placeholder="Account id(eg:-0x5123ee664cdf45DAD30e67Ccbf51E1E66DC65596)"></input></div></td>
                    </tr>
                    <tr>
                        <td colSpan="3"><center><button onClick={this.delUser}>Delete Record</button></center></td>
                    </tr>
                </table>
            </div>
            <div id="note">
                <p>**This is only for Admin
                    <br />
                    if you are patient You can View Your Record***
                    <br />
                    <Link to="/PatientRecord">View Record</Link>
                </p>
            </div>
            </div>
        </div>
            )
        }
}

export default DelRec;