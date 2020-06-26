import React, { Component } from "react";
import { Router, Switch, Route,Redirect} from "react-router-dom";



import history from './history';
import Home from './Home'
import ViewRecord from './ViewPatientRec'
import DeleteRecord from './DelRec'
import EditDrInfo from './Doctor/EditInfo'
import EditPatInfo from './Patient/PatientEditInfo'
import ViewMedRec from './Patient/ViewMedRec'
import ViewInfo from './Doctor/Viewinfo'
import DoctorInfo from './Doctor/Doctors'
import AddpatientRec from './Doctor/AddPatientRec'
import UpdateRec from './Doctor/UpdateRec'
import Admin from './Admin/admin'
import addDoc from './Admin/addDocter'
import addPat from './Admin/addPatient'
import DeleteUser from "./Admin/deleteUser";
 


export default class Routes extends Component {
    render() {
        return (
            <Router history={history}>
                <Switch>
                    <Route path="/" exact component={() => (<Redirect to='/home' />)}/>
                    <Route path="/home" exact component={Home}/>
                    <Route path="/PatientRecord" component={ViewRecord} />
                    <Route path="/DeleteRecord" component={DeleteRecord} />
                    <Route path="/EditDrInfo" component={EditDrInfo} />
                    <Route path="/DoctorInfo" component={ViewInfo} />
                    <Route path="/EditPatientInfo" component={EditPatInfo} />
                    <Route path="/Doctors" component={DoctorInfo} />
                    <Route path="/MedicalRecords" component={ViewMedRec} />
                    <Route path="/UpdateRecord" component={UpdateRec} />
                    <Route path="/admin" component={Admin}/>
                    <Route path="/add-doctor" component={addDoc} />
                    <Route path="/add-patient" component={addPat} />
                    <Route path="/delete-user" component={DeleteUser} />
                    <Route path="/addpatientrecord" component={AddpatientRec}/>
                </Switch>
            </Router>
        )
    }
}
