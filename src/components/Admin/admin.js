import React, { Component } from 'react';
import "tabler-react/dist/Tabler.css";
import { Card,Nav,Grid,ProgressCard } from "tabler-react";
import Web3 from 'web3'
import Meme from '../../abis/Contract.json'
import Chart from 'chart.js';
import swal from 'sweetalert';
import history from '../history'


import './css/admin.css'



class Admin extends Component{

  async componentDidMount(){
    document.getElementById('nav').style.visibility = "hidden"
    await this.loadWeb3()
    await this.loadBlockChain() 
    await this.checkAdmin()
  }

  constructor(props){
    super(props)
    this.state = {
      account: null,
      contract: null,
      web3: null,
    }
    this.state = {isAdmin: false};
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
   }else{
     window.alert('Contarct not Deployed')
   }
   window.ethereum.on('accountsChanged', function (accounts) {
    window.location.reload()
  })
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

async checkAdmin(){
  document.getElementById('lds').style.visibility ="visible"
    const adminId = await this.state.contract.methods.getAdmin().call()
    if(this.state.account===adminId){
      this.setState({isAdmin : true})
      document.getElementById('lds').style.visibility ="hidden"
      this.chart();
    }
    else{
      document.getElementById('lds').style.visibility ="hidden"
      swal({
        title: "Acess Deneid",
        text: "Only Admin have acess to this page",
        icon: "error",
        button: {
                text:"go back",
                value:"back"
              }
      }).then((value)=>{
        history.push("/home")
      })
    }
  }
  chart(){
    var ctx = document.getElementById('myChart');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'jun'],
        datasets: [{
            label: 'eths Received',
            data: [600, 500, 400, 300, 100, 200],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1.5
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});
var ctx1 = document.getElementById('myChart2');
var myChart1 = new Chart(ctx1, {
    type: 'line',
    data: {
      datasets: [{
          data: [20, 50, 100, 75, 25, 0],
          label: 'Doctors',

          // This binds the dataset to the left y axis
          yAxisID: 'left-y-axis'
      }, {
          data: [0.1, 0.5, 1.0, 2.0, 1.5, 0],
          label: 'Patients',

          // This binds the dataset to the right y axis
          yAxisID: 'right-y-axis'
      }],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  },
  options: {
      scales: {
          yAxes: [{
              id: 'left-y-axis',
              type: 'linear',
              position: 'left'
          }, {
              id: 'right-y-axis',
              type: 'linear',
              position: 'right'
          }]
      }
  }
});
  }



  render() {
    const isAdmin = this.state.isAdmin
    return (
    <div id="admin">
      <center><div id="lds"><div></div><div></div><div></div><div></div><div></div></div></center>
      {isAdmin
      ?<div class="admin">
          <div id="header">
              <Nav>
                    <Nav.Item  active  hasSubNav value="Admin" icon="user">
                      <Nav.SubItem to="/add-doctor" value="Add Doctor" icon="user-plus" />
                        <Nav.SubItem to="/add-patient" value="Add Patient" icon="user-plus"></Nav.SubItem>
                        <Nav.SubItem to="/delete-user" icon="user-x">Delete User</Nav.SubItem>
                      </Nav.Item>
                      <Nav.Item icon="edit">Appointments</Nav.Item>
                      <Nav.Item to="/" icon="log-out">
                        Log Out
                      </Nav.Item>
                  </Nav>
              </div>

          <div id="banner">

            <div id="h1top">
              <h1 id="h1top"
            style={{"color":"#d45202","fontSize":"32px","fontWeight":"bold","padding": "10px","textAlign":"center"}}>
              Medic Plus+  Admin Page</h1>
            </div>
    
            <div id="cards">
              <center><div id="live">live updates<div class="livenow"><div></div><div></div><div></div></div></div></center>
                <center>
                  <div id="card">
                  <Grid.Row cards deck>
                  <Grid.Col md={6}>
                    <Card statusColor="purple" isCollapsible="true" title="Doctors" 
                      body={<div>
                            <ProgressCard
                            content={<div >
                              <i style={{"color":"#00d0f1","border": "3px solid","border-radius": "50px","padding": "10px","float":"left"}} class="fe fe-users"></i>
                              <h1 style={{"color":"#918b8a","fontSize":"28px","fontWeight":"bold","padding": "10px","textAlign":"right"}}>108</h1>
                              <h3 style={{"color":"grey","fontSize":"16px","fontWeight":"bold","textAlign":"left"}}>Doctors</h3></div>
                              }
                            progressColor="green"
                            progressWidth={58}
                        />
                          
                        </div>
                        }
                    />
                  </Grid.Col>

                  <Grid.Col md={6}>
                    <Card statusColor="red" isCollapsible="true" title="Patients"
                      body={<div>
                            <ProgressCard
                            content={<div >
                              <i style={{"color":"#699834","border": "3px solid","border-radius": "50px","padding": "10px","float":"left"}} class="fe fe-credit-card"></i>
                              <h1 style={{"color":"#918b8a","fontSize":"28px","fontWeight":"bold","padding": "10px","textAlign":"right"}}>205</h1>
                              <h3 style={{"color":"grey","fontSize":"16px","fontWeight":"bold","textAlign":"left"}}>Patients</h3></div>
                              }
                            progressColor="#940749"
                            progressWidth={38}
                            />
                        </div>
                        }
                    />
                  </Grid.Col>
                  </Grid.Row>
                  <Grid.Row>
                  <Grid.Col md={6}>
                    <Card statusColor="blue" title="Appointments" isCollapsible="true"
                    body={<div>
                            <ProgressCard
                            content={<div >
                              <i style={{"color":"#e84646","border": "3px solid","border-radius": "50px","padding": "10px","float":"left"}} class="fe fe-folder"></i>
                              <h1 style={{"color":"#918b8a","fontSize":"28px","fontWeight":"bold","padding": "10px","textAlign":"right"}}>360</h1>
                              <h3 style={{"color":"grey","fontSize":"16px","fontWeight":"bold","textAlign":"left"}}>Appointments</h3></div>
                              }
                            progressColor="red"
                            progressWidth={74}
                            />
                        </div>
                        }
                    />
                  </Grid.Col>
                  <Grid.Col md={6}>
                    <Card statusColor="green" title="Revenue" isCollapsible="true"
                    body={<div>
                            <ProgressCard
                            content={<div >
                              <i style={{"color":"#22e068","border": "3px solid","border-radius": "50px","padding": "10px","float":"left"}} class="fe fe-dollar-sign"></i>
                              <h1 style={{"color":"#918b8a","fontSize":"28px","fontWeight":"bold","padding": "10px","textAlign":"right"}}>7560.46</h1>
                              <h3 style={{"color":"grey","fontSize":"16px","fontWeight":"bold","textAlign":"left"}}>Revenue</h3></div>
                              }
                            progressColor="purple"
                            progressWidth={64}
                            />
                        </div>
                        }
                    
                    />
                  </Grid.Col>
                </Grid.Row>
                  </div>
                
                </center>
            </div>

          <div id="rows">        
          <div class="row">
              <div class="col-md-12 col-lg-6">
                <div class="card card-chart">
                  <div class="card-header">
                    <h4 class="card-title">Revenue</h4>
                  </div>
                  <div class="card-body">
                    <canvas id="myChart" width="500" height="300"></canvas>
                  </div>
                </div>
              
                
              </div>
              <div class="col-md-12 col-lg-6">
              
              
                <div class="card card-chart">
                  <div class="card-header">
                    <h1 class="card-title">Status</h1>
                  </div>
                  <div class="card-body">
                    <canvas id="myChart2" width="500" height="300"></canvas>
                  </div>
                </div>
                
                
              </div>	
            </div>
            </div>
            </div>
            </div>
      :<div></div>}
      </div>
    );
  }
}

export default Admin;