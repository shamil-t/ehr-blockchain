import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { MDBCol, MDBIcon,MDBInput} from "mdbreact";
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import history from '../history'
import backico from '../images/back.png';
import srchico from '../images/search_ico.png'
import './viewInfo.css'


class ViewInfo extends Component{

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
        await this.loadBlockChain()
        await this.loadWeb3()
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

    searchInfo = async (event) =>{
        event.preventDefault()
        const search = document.getElementById('bar').value
        console.log(search)
        document.getElementById('lds').style.visibility = "visible"
        await this.state.contract.methods.search(search).send({from : this.state.account})
        .on("confirmation" ,(e)=>{
            document.getElementById('lds').style.visibility = "hidden"
            history.push('/Doctors')
        }).on("error",(err)=>{
            window.alert("")
            document.getElementById('lds').style.visibility = "hidden"
        })
    }

    render(){
        
        return(
            <div id="viewInfo">
                <div id="g_back">          
                        <Link  to="/AddPatientRec"><img src={backico} width="40" height="30" alt="backimg"></img>Back</Link>
                </div>
                <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
                
                <h1 id="h1">Doctors Info's</h1>
                <div id="searchbar">
                    <center>
                        <MDBCol md="6">
                            <MDBIcon icon="search" />
                            <MDBInput 
                                id="bar" 
                                type="text" 
                                hint="Enter the Account id of the Doctor (0x7aF32124e1Df4c17000Df10.....)" 
                                >
                            </MDBInput>
                            <button id="srch_btn" onClick={this.searchInfo}><img src={srchico} alt="SERACH" /></button>
                        </MDBCol>
                    </center>
                </div> 
            </div>
        )
    }
    

}

export default ViewInfo;