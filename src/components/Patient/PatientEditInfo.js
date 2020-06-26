import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import backico from '../images/back.png';
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import dr_ico from '../images/pat_ico.png'
import './Edit.css'
import ipfs from '../ipfs'

class EditPatInfo extends Component{

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
          IpfsHash : '',
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

     addInfo = async (event) =>{
       event.preventDefault()

       const name = document.getElementById('inputname').value
       const addr = document.getElementById('addr').value
       const age = document.getElementById('age').value
       const phno = document.getElementById('num').value
       const blood = document.getElementById('select').value
       const height = document.getElementById('height').value
       const weight = document.getElementById('weight').value

       const patInfo = 
        {
          name :name,
          addr :addr,
          age :age,
          phno:phno,
          blood:blood,
          height:height,
          weight:weight
       }
      

       console.log(name,addr,age,phno,blood,height,weight)
       const infos = JSON.stringify(patInfo)
       document.getElementById('PatEdit').style.visibility="hidden"
       document.getElementById('lds1').style.visibility="visible"
        await ipfs.add(infos).then( hash =>{
        console.log(hash)
        this.state.contract.methods.addPatInfo(hash).send({from: this.state.account}).on("confirmation", (r) => {
            window.alert("Patients info Updated Successfully")
            document.getElementById('lds1').style.visibility="hidden"
            document.getElementById('PatEdit').style.visibility="visible"
        }).on("error",(er)=>{
          window.alert("1.patient can Add There on Primary Details \n")
          document.getElementById('lds1').style.visibility="hidden"
          document.getElementById('PatEdit').style.visibility="visible"
        });
     })
      

     }

     

render(){
        return(
            <div id="editinfo">
                <div id="g_back">          
                    <Link  to="/"><img src={backico} width="40" height="30" alt="back"></img>Home</Link> 
                </div>
                <div id="PatEdit">
                    <center>   
                        <img id="dr_ico" src={dr_ico} alt={dr_ico} ></img>
                        <form onSubmit={this.addInfo}>
                        <table>
                            <tr>
                                <td>Full Name :-</td>
                                <td>
                                    <input id="inputname" type="text" placeholder="Fullname" required="required"></input>
                                </td>
                            </tr>
                            <tr>
                                    <td>Address :-</td>
                                    <td><textarea id="addr" type="text" placeholder="Residential Address" required="required"></textarea></td>
                                </tr>
                                <tr>
                                    <td>Age :-</td>
                                    <input class="htwt" id="age" type="number" placeholder="yr" required="required"></input>
                                </tr>
                                <tr>
                                    <td>Phone no :-</td>
                                    <td><input id="num" type="number" placeholder="PatientPhoneNumber" required="required"></input></td>
                                </tr>
                                <tr>
                                    <td>BloodGroup :-</td>
                                    <td>
                                        <select id="select">
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
                                    <input class="htwt" id="height" type="number" placeholder="in cm"></input>
                                </tr>
                                <tr>
                                    <td>Weight :-</td>
                                    <input class="htwt" id="weight" type="number" placeholder="in kg"></input>
                                </tr>
                            
                            <tr>
                                <td colSpan="2">
                                    <center><input type="submit" id="adddrinfo" value="Add Details" ></input></center>
                                </td>
                            </tr>
                        </table>
                        </form>
                    </center>
                </div>
                <center><div id="lds1"><div></div><div></div><div></div><div></div><div></div></div></center>
            </div>
        )
    }

}
export default EditPatInfo;