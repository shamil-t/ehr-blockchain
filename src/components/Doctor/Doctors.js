import React, { Component } from 'react';
import Web3 from 'web3'
import { Link } from 'react-router-dom';
import backico from '../images/back.png';
import Meme from '../../abis/Contract.json'
import dr_ico from '../images/dr_icon.png'
import './doctors.css'
import ipfs from '../ipfs'

class Doctors extends Component{

    async componentWillMount(){
        await this.loadWeb3()
        await this.loadBlockChain()
        await this.getDrInfo()
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
        console.log(contract)
        const memeHash = await contract.methods.get().call()
        console.log("Value",memeHash)
         

         
         
       }else{
         window.alert('Contarct not Deployed')
       }
     }
   
     constructor(props){
       super(props);
       this.state={
         contract: null,
         web3: null,
         account: null,
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


     async getDrInfo(){
       console.log(this.state.account)
        await this.state.contract.methods.getDrInfo().call().then(value =>{
          ipfs.cat(value).then(data =>{
            console.log(data)
            var val = JSON.parse(data)
            document.getElementById('drname').innerHTML=val.Name
            document.getElementById('drqual').innerHTML=val.Quali
            document.getElementById('drspec').innerHTML = val.Spec
          })
        })
     }



render(){
    return(
        <div id="Drsbody">
          <div id="g_back">          
                    <Link  to="/"><img src={backico} width="40" height="30" alt="back"></img>Home</Link> 
                </div>
            <center>   
            <div id="drinfo">
                  <img id="dr_ico" src={dr_ico} alt={dr_ico} ></img>
                  <table>
                      <tr>
                          <td>Full Name :-</td>
                          <td>
                            <p class="dinfo" id="drname"></p>
                          </td>
                      </tr>
                      <tr>
                        <td>Specialization :-</td>
                        <td>
                          <p class="dinfo" id="drspec"></p>
                        </td>
                      </tr>
                      <tr>
                        <td>Qualifications :-</td>
                        <td>
                          <p class="dinfo" id="drqual"></p>
                        </td>
                      </tr>
                  </table>
            </div>
            </center>
        </div>
    )
    
}
}

export default Doctors;