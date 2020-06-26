import React, { Component } from 'react';
import Web3 from 'web3'
import Meme from '../abis/Contract.json'
import Routes from './Routes';

import './css/Home.css'
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown'




class App extends Component {

  async componentWillMount(){
     await this.loadWeb3()
     await this.loadBlockChain()

  }
 

  async loadBlockChain(){
    /*const web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
    const accounts = await web3.eth.getAccounts()*/
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    //console.log(accounts)
    
    this.setState({ account: accounts[0] })
    /*window.onfocus = () => {
      window.location.reload();
  }*/
    
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    const networkData = Meme.networks[networkId]
    console.log(networkData)
    if (networkData){
      const abi = Meme.abi
      //console.log(abi)
      const address = networkData.address
      const contract = web3.eth.Contract(abi, address)
      this.setState({ contract })
      console.log(contract)
      /*const memeHash = await contract.methods.get().call()
      this.setState({ memeHash })
      console.log(memeHash)*/
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

  /*async loadWeb3(){
   if(window.ethereum){
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }if(window.web3){
      window.web3 = new Web3(window.web3.contentProvider)
    }else{
      window.alert('please use metamask')
    }
    
  }*/

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


  render() {
    
    return (
      <div className="App">
        <div id= "nav">
          <Navbar collapseOnSelect expand="lg" bg="light" >
            <Navbar.Brand href="/">Medic Plus+</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto">
                <NavDropdown renderMenuOnMount={true} title={<div><span class="flaticon-stethoscope"></span>&nbsp;&nbsp; Doctor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>} id="collasible-nav-dropdown" style={{width: '150px'}}>
                  <NavDropdown.Item href="/addpatientrecord"><i class="fe fe-user-plus"></i>&nbsp;&nbsp;Add Patient Record</NavDropdown.Item>
                  <NavDropdown.Item href="/UpdateRecord"><i class="fa fa-id-card"></i>&nbsp;&nbsp;Update Patient Record</NavDropdown.Item>
                  <NavDropdown.Item href="/"><i class="fe fe-user-x"></i>&nbsp;&nbsp;Delete Patient Record</NavDropdown.Item>
                  <NavDropdown.Item href="/EditDrInfo"><i class="fe fe-edit"></i>&nbsp;&nbsp;Edit About Info</NavDropdown.Item>
                  <NavDropdown.Item href="/DoctorInfo"><i class="fe fe-eye"></i>&nbsp;&nbsp;View Info</NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title={<div><i class="fe fe-user"></i>&nbsp;&nbsp;Patient &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>} id="collasible-nav-dropdown">
                  <NavDropdown.Item href="/PatientRecord"><i class="fa fa-id-card-o"></i>&nbsp;&nbsp;View Medical Record</NavDropdown.Item>
                  <NavDropdown.Item href="/EditPatientInfo"><i class="fe fe-edit"></i>&nbsp;&nbsp;Edit About Info</NavDropdown.Item>
                  <NavDropdown.Item href="/"><i class="fe fe-eye"></i>&nbsp;&nbsp;View About Info</NavDropdown.Item>
                </NavDropdown>
              </Nav>
              <Nav>
              <Nav.Link eventKey={2} href="/admin">
              <i class="fa fa-user-circle-o"></i>&nbsp;&nbsp;Admin
                </Nav.Link>
                <Nav.Link eventKey={2} href="/">
                  <i class="fa fa-info-circle"></i>&nbsp;&nbsp;About
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
      </div>
      <Routes />
    </div>
    );
  }
}

//export default App;
export default App;