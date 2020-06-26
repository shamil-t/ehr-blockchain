import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import backico from '../images/back.png';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import dr_ico from '../images/dr_icon.png'
import './Edit.css'
import ipfs from '../ipfs'

class EditDrInfo extends Component{

    async componentWillMount(){
        await this.loadWeb3()
        await this.loadBlockChain()
     }
   
     constructor(props){
        super(props);
        this.state={
          contract: null,
          web3: null,
          account: null,
          buffer : null,
          IpfsHash : ''
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


     addDrInfo = async (event) =>{
        event.preventDefault()

        document.getElementById('lds-ellipsis').style.visibility = "visible"
        document.getElementById('Edit').style.visibility = "hidden"

        const name = document.getElementById('inputname').value
        const quli = document.getElementById('qual').value
        const spec = document.getElementById('spec').value

        var DrInfos = {
          "Name" : name ,
          "Quali" : quli,
          "Spec" : spec
        }
        var Drinfo = JSON.stringify(DrInfos)

        await ipfs.add(Drinfo).then( Drhash =>{
          console.log(Drhash)
          this.state.contract.methods.addDrInfo(Drhash).send({from: this.state.account}).on("confirmation", 
          (r) => {
            window.alert("Your Info Updated Successfully")
            document.getElementById('lds-ellipsis').style.visibility = "hidden"
            document.getElementById('Edit').style.visibility = "visible"
          }).on("error",(er)=>{
            window.alert("1.You can only Add Your Info\n2.only for docter")
            document.getElementById('lds-ellipsis').style.visibility = "hidden"
            document.getElementById('Edit').style.visibility = "visible"
          });
        })
        document.getElementById('inputname').value=""
        document.getElementById('qual').value=""
     }

render(){
        return(
            <div id="editinfo">
                <div id="g_back">          
                    <Link  to="/"><img src={backico} width="40" height="30" alt="back"></img>Home</Link> 
                </div>
                <div id="Edit">
                    <center>   
                        <img id="dr_ico" src={dr_ico} alt={dr_ico} ></img>
                        <table>
                            <tr>
                                <td>Full Name :-</td>
                                <td>
                                    <input id="inputname" type="text" placeholder="Fullname" required="required"></input>
                                </td>
                            </tr>
                            <tr>
                              <td>Specialization :-</td>
                              <td>
                                <input id="spec" type="text" placeholder="Specializations" required="required"></input>
                              </td>
                            </tr>
                            <tr>
                                <td>Qualifications :-</td>
                                <td>
                                    <input id="qual" type="text" placeholder="Qualifications" required="required"></input>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2">
                                    <center><button id="adddrinfo" onClick={this.addDrInfo}>Add Details</button></center>
                                </td>
                            </tr>
                        </table>
                    </center>
                </div>
                <center><div id="lds-ellipsis"><div></div><div></div><div></div><div></div><div></div></div></center>
            </div>
        )
    }

}
export default EditDrInfo;