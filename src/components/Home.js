import React, { Component } from 'react';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import { Link } from 'react-router-dom';
import Web3 from 'web3'
import Meme from '../abis/Contract.json'

import './css/Home.css';
import './css/style.css'

import assistant from './images/assistant_ico.png'
import chatico from './images/chatbot.png'
import doc2 from './images/doc-2.jpg'




class Home extends Component {

    constructor(props){
        super(props);
        this.state = {
            slideIndex : 0
        }
        this.state = {isChatOn: false};

    }
    async componentDidMount(){
     document.getElementById('nav').style.visibility = "visible"
     await this.loadBlockChain()
     await this.loadWeb3()
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

  showChat = (event) =>{
    event.preventDefault()
    this.setState({isChatOn: true});
    if(document.getElementById('bot').style.visibility === "visible"){
      document.getElementById('bot').style.visibility = "hidden"
    }
    else{
      document.getElementById('bot').style.visibility = "visible"

    }
  }   

          

render() {
    const steps = [
        {
          id: '1',
          message: 'Hello welcome to medicPlus , i am your medicPlus assistant , What can i do for you.',
          trigger :'2'
        },
        {
          id: '2',
          options: [
            { value: 1, label: 'Disease Symptom analysis', trigger: '3' },
            { value: 2, label: 'Make an Appointment', trigger: '4' },
            { value: 3, label: 'View Records', trigger: '5' },
            { value: 4, label: 'Add Info', trigger: '6' },
          ],
        },
        {
          id:'3',
          message:'hi',
        },
        {
          id:'4',
          message:'hi',
        },
        {
          id:'5',
          message:'hi',
        },
        {
          id: '6',
          component: (
            <div> <Link to="/EditPatientInfo">click here</Link>for redirecting to Add info page</div>
          ),
          end: true,
        },
      ];
      const theme = {
        background: '#4C75AB',
        fontFamily: 'consolas',
        headerBgColor: '#00224E',
        headerFontColor: '#fff',
        headerFontSize: '18px',
        botBubbleColor: '#003365',
        botFontColor: '#fff',
        userBubbleColor: '#fff',
        userFontColor: '#4a4a4a',
      };
      
    const settings =  {
        arrows: false,
      arrowsBlock: false,
      accessibility: false,
      autoplay: true,
      centerMode: true,
      centerPadding: 0,
      dots: true,
      wheel: true,
      onHoverPause:false,
      };

      const isChatOn = this.state.isChatOn;

    return (
    <div id="body">

       <div id="home">

            <section class="her-wrap js-fullheight" data-section="home" data-stellar-background-ratio="0.5">
              
              <div class="container">
                <div class="row no-gutters slider-text js-fullheight align-items-center justify-content-start" data-scrollax-parent="true">
                  <div class="col-md-6">
                    <div class="subh">
                      <span class="subheading">Welcome to EHR BlockChain</span>
                      <h1 class="mb-4">We are here <br/>for your Care</h1>
                      <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove.</p>
                      <p><a style={{"borderRadius":"30px","fontSize":"18px"}} href="#appointment" class="btn btn-primary py-3 px-4">Make an appointment</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </section>


    <div class="ftco-section ftco-no-pt ftco-no-pb" id="department-section">
    	<div class="container-fluid px-0">
    		<div class="row no-gutters">
    			<div class="col-md-4 d-flex">
    				<div class="img img-dept align-self-stretch" ><img src={doc2} width="100%" height="100%"></img></div>
    			</div>

    			<div class="col-md-8">
    				<div class="row no-gutters">
    					<div class="col-md-4">
    						<div class="department-wrap p-4 ">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Neurology</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Surgical</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Dental</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    					</div>

    					<div class="col-md-4">
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Opthalmology</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Cardiology</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Traumatology</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    					</div>

    					<div class="col-md-4">
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Nuclear Magnetic</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">X-ray</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    						<div class="department-wrap p-4 ">
    							<div class="text p-2 text-center">
    								<div class="icon">
    									<span class="flaticon-stethoscope"></span>
    								</div>
    								<h3><a href="#">Cardiology</a></h3>
    								<p>Far far away, behind the word mountains</p>
    							</div>
    						</div>
    					</div>
    				</div>
    			</div>
    		</div>
    	</div>
    </div>



            <div class="ftco-section ftco-no-pt ftco-no-pb ftco-services-2 bg-light">
          <div class="container">
            <div class="row d-flex">
              <div class="col-md-7 py-5">
                <div class="py-lg-5">
                  <div class="row justify-content-center pb-5">
                    <div class="col-md-12">
                      <h2 class="mb-3">Our Services</h2>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="media block-6 services d-flex">
                        <div class="icon justify-content-center align-items-center d-flex"><span class="flaticon-ambulance"></span></div>
                        <div class="media-body pl-md-4">
                          <h3 class="heading mb-3">Emergency Services</h3>
                          <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
                        </div>
                      </div>      
                    </div>
                    <div class="col-md-6">
                      <div class="media block-6 services d-flex">
                        <div class="icon justify-content-center align-items-center d-flex"><span class="flaticon-doctor"></span></div>
                        <div class="media-body pl-md-4">
                          <h3 class="heading mb-3">Qualified Doctors</h3>
                          <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
                        </div>
                      </div>      
                    </div>
                    <div class="col-md-6">
                      <div class="media block-6 services d-flex">
                        <div class="icon justify-content-center align-items-center d-flex"><span class="flaticon-stethoscope"></span></div>
                        <div class="media-body pl-md-4">
                          <h3 class="heading mb-3">Outdoors Checkup</h3>
                          <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
                        </div>
                      </div>      
                    </div>
                    <div class="col-md-6">
                      <div class="media block-6 services d-flex">
                        <div class="icon justify-content-center align-items-center d-flex"><span class="flaticon-24-hours"></span></div>
                        <div class="media-body pl-md-4">
                          <h3 class="heading mb-3">24 Hours Service</h3>
                          <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
                        </div>
                      </div>      
                    </div>
                    
                  </div>

                </div>
              </div>
              <div class="col-md-5 d-flex" id="appointment">
                <div class="appointment-wrap bg-white p-4 p-md-5 d-flex align-items-center">
                <form action="#" class="appointment-form" >
                    <h3>Make Appointment</h3>
                    <div class="">
			    				<div class="form-group">
			    					<input type="text" class="form-control" placeholder="First Name"/>
			    				</div>
			    				<div class="form-group">
			    					<input type="text" class="form-control" placeholder="Last Name"/>
			    				</div>
		    				</div>
		    				<div class="">
		    					<div class="form-group">
			    					<div class="form-field">
	          					<div class="select-wrap">
	                      <div class="icon"><span class="ion-ios-arrow-down"></span></div>
	                      <select name="" id="" class="form-control">
	                      	<option value="">Select Your Services</option>
	                        <option value="">Neurology</option>
	                        <option value="">Cardiology</option>
	                        <option value="">Dental</option>
	                        <option value="">Ophthalmology</option>
	                        <option value="">Other Services</option>
	                      </select>
	                    </div>
			              </div>
			    				</div>
		    					<div class="form-group">
			    					<input type="text" class="form-control" placeholder="Phone"/>
			    				</div>
		    				</div>
		    				<div class="">
			    				<div class="form-group">
			    					<div class="input-wrap">
			            		<div class="icon"><span class="ion-md-calendar"></span></div>
			            		<input type="text" class="form-control appointment_date" placeholder="Date"/>
		            		</div>
			    				</div>
			    				<div class="form-group">
			    					<div class="input-wrap">
			            		<div class="icon"><span class="ion-ios-clock"></span></div>
			            		<input type="text" class="form-control appointment_time" placeholder="Time"/>
		            		</div>
			    				</div>
		    				</div>
		    				<div class="">
		    					<div class="form-group">
			              <textarea name="" id="" cols="30" rows="2" class="form-control" placeholder="Message"></textarea>
			            </div>
			            <div class="form-group">
			              <input type="submit" value="Appointment" class="btn btn-secondary py-3 px-4" style={{"borderRadius":"30px"}}/>
			            </div>
		    				</div>

                </form>
                </div>
            </div>
            </div>
            
          </div>
        </div>

            <footer class="ftco-footer ftco-section img">
          <div class="overlay"></div>
          <div class="container-fluid px-md-5">
            <div class="row mb-5">
              <div class="col-md">
                <div class="ftco-footer-widget mb-4">
                  <h2 class="ftco-heading-2">Mediplus</h2>
                  <p>Far far away, behind the word mountains, far from the countries.</p>
                  <ul class="ftco-footer-social list-unstyled mt-5">
                    <li class="ftco-animate"><a href="#"><span class="icon-twitter"></span></a></li>
                    <li class="ftco-animate"><a href="#"><span class="icon-facebook"></span></a></li>
                    <li class="ftco-animate"><a href="#"><span class="icon-instagram"></span></a></li>
                  </ul>
                </div>
              </div>
              <div class="col-md">
                <div class="ftco-footer-widget mb-4 ml-md-4">
                  <h2 class="ftco-heading-2">Departments</h2>
                  <ul class="list-unstyled">
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Neurology</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Opthalmology</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Nuclear Magnetic</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Surgical</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Cardiology</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Dental</a></li>
                  </ul>
                </div>
              </div>
              <div class="col-md">
                <div class="ftco-footer-widget mb-4 ml-md-4">
                  <h2 class="ftco-heading-2">Links</h2>
                  <ul class="list-unstyled">
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Home</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>About</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Departments</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Doctors</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Blog</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Contact</a></li>
                  </ul>
                </div>
              </div>
              <div class="col-md">
                <div class="ftco-footer-widget mb-4">
                  <h2 class="ftco-heading-2">Services</h2>
                  <ul class="list-unstyled">
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Emergency Services</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Qualified Doctors</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>Outdoors Checkup</a></li>
                    <li><a href="#"><span class="icon-long-arrow-right mr-2"></span>24 Hours Services</a></li>
                  </ul>
                </div>
              </div>
              <div class="col-md">
                <div class="ftco-footer-widget mb-4">
                  <h2 class="ftco-heading-2">Have a Questions?</h2>
                  <div class="block-23 mb-3">
                    <ul>
                      <li><span class="text">Ask to our chat bot .. 🤖</span></li>
                      <li><span class="icon icon-map-marker"></span><span class="text">203 Fake St. Mountain View, San Francisco, California, USA</span></li>
                      <li><a href="#"><span class="icon icon-phone"></span><span class="text">+2 392 3929 210</span></a></li>
                      <li><a href="#"><span class="icon icon-envelope pr-4"></span><span class="text">info@yourdomain.com</span></a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </footer>
    </div>

    <div id="chatBot">
          <div id="bot">
           {isChatOn
           ?<ThemeProvider theme={theme}>
                <ChatBot botAvatar={assistant} headerTitle="EHR BlockChain chat bot" speechSynthesis={{ enable: true, lang: 'en' }} steps={steps} />
            </ThemeProvider>
            :<div></div>
            }
          </div>
          <button class="btn" id="chatbtn" onClick={this.showChat}>
          <span>Chat Bot</span>
            <img src={chatico} width="50" height="50"></img>
          </button>
    </div>

</div>

    );

}
}

export default Home;

//navbar

/*
<Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
        <Navbar.Brand href="/">EHR Home</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
            <NavDropdown title="&nbsp;&nbsp;&nbsp; Doctor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" id="collasible-nav-dropdown" style={{width: '150px'}}>
              <NavDropdown.Item href="/AddPatientRec">Add Patient Record</NavDropdown.Item>
              <NavDropdown.Item href="/UpdateRecord">Update Patient Record</NavDropdown.Item>
              <NavDropdown.Item href="/">Delete Patient Record</NavDropdown.Item>
              <NavDropdown.Item href="/EditDrInfo">Edit About Info</NavDropdown.Item>
              <NavDropdown.Item href="/DoctorInfo">View Info</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="&nbsp;&nbsp;&nbsp; Patient &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" id="collasible-nav-dropdown">
              <NavDropdown.Item href="/PatientRecord">View Medical Record</NavDropdown.Item>
              <NavDropdown.Item href="/EditPatientInfo">Edit About Info</NavDropdown.Item>
              <NavDropdown.Item href="/">View About Info</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav>
          <NavDropdown title=" Administrator&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" id="collasible-nav-dropdown">
              <NavDropdown.Item href="/AddUser">Add a User</NavDropdown.Item>
              <NavDropdown.Item href="DeleteRecord">Delete a User</NavDropdown.Item>
              <NavDropdown.Item href="/">Add Admin</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link eventKey={2} href="/">
              About
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>


*/


//Slider
/*


 <div id="slider">
                <Slider { ...settings }>
                <div>
                    <img src={img1} width="100%" height="500" alt="img1"></img>
                </div>
                <div>
                    <img src={img2} width="100%" height="500" alt="img2"></img>
                </div>
                <div>
                    <img src={img3} width="100%" height="500" alt="img3"></img>
                </div>
                <div>
                    <img src={img4} width="100%" height="500" alt="img4"></img>
                </div>
                <div>
                    <img src={img5} width="100%" height="500" alt="img5"></img>
                </div>
                <div>
                    <img src={img6} width="100%" height="500" alt="img6"></img>
                </div>
                <div>
                    <img src={img7} width="100%" height="500" alt="img7"></img>
                </div>
                <div>
                    <img src={img8} width="100%" height="500" alt="img8"></img>
                </div>
                <div>
                    <img src={img9} width="100%" height="500" alt="img9"></img>
                </div>
                <div>
                    <img src={img10} width="100%" height="500" alt="img10"></img>
                </div>
                </Slider>
            </div>

*/ 