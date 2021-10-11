import React from 'react';
import {
    Button,
    TextField,
    Grid,
    Typography,
    Dialog
} from "@material-ui/core";
import axios from 'axios';
import './loginRegister.css';

class LoginRegister extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            username: "",
            password: "",
            firstname: "",
            lastname: "",
            location: "",
            occupation: "",
            description: "",
            newUsername: "",
            newPass: "",
            newPassConfirm: "",
            passMatch: true,
            open: false,
            modalMessage: "",
        }
    }

    handleChange(e) {
        this.setState({ username: e.target.value })
    }

    handlePassChange(e) {
        this.setState({ password: e.target.value });
    }

    handleRegisterChange(e) {
        this.setState({ [e.target.name] : e.target.value });
    }

    handleNewRegister() {
        if (this.state.newPass !== this.state.newPassConfirm) {
            this.setState({ passMatch: false });
            return;
        }
        if (this.state.newPass === this.state.newPassConfirm) {
            this.setState({ passMatch: true });
        }
        let newUser = {
            first_name: this.state.firstname,
            last_name: this.state.lastname,
            location: this.state.location,
            occupation: this.state.occupation,
            description: this.state.description,
            login_name: this.state.newUsername,
            password: this.state.newPass
        }
        let mypromise = axios.post('/user', newUser);
        mypromise.then(() => {
            console.log("Registration success!");
            let successMes = "Registration successfull!";
            this.handleSuccessOpen(successMes);

            // reset states
            this.setState({ 
                firstname: "",
                lastname: "",
                location: "",
                occupation: "",
                description: "",
                newUsername: "",
                newPass: "",
                newPassConfirm: "",
                passMatch: true,
            })
        }).catch((err) => {
            this.handleOpen(err);
        });
    }

    handleSuccessOpen(mes) {
        this.setState({ modalMessage: mes });
        this.setState({ open: true });
    }

    handleOpen(err) {
        this.setState({ modalMessage: err.response.data });
        this.setState({ open: true });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleSubmit() {
        let mypromise = axios.post('/admin/login', {
            login_name: this.state.username,
            password: this.state.password,
        });
        mypromise.then((response) => {
            console.log("logged in"); // test check
            window.localStorage.setItem('isLoggedIn', true);
            window.location.replace("/photo-share.html#/users/" + response.data._id);
            window.location.reload();
        }).catch((err) => {
            console.log(err)
            this.handleOpen(err);
            this.setState({ password: "" });
            this.setState({ username: "" });
        });
        
    }

    render() {
        return (
            <div>
                <form className="form-container">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                label="Username" 
                                size="small" 
                                value={this.state.username}
                                onChange={(e) => {this.handleChange(e)}} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                label="Password" 
                                name="password" 
                                size="small" 
                                type="password"
                                value={this.state.password}
                                onChange={(e) => {this.handlePassChange(e)}}/>
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                                fullWidth 
                                color="primary" 
                                variant="contained"
                                onClick={() => {this.handleSubmit()}}>
                                    Log In
                            </Button>
                        </Grid>
                    </Grid>
                </form>
                <div className='register-form'>
                    {/* <Typography variant="h5">Register as new user:</Typography> */}
                    <form>
                        <Grid container spacing={3}>
                            
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="First Name"  
                                    name="firstname" 
                                    value={this.state.firstname} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Last Name" 
                                    name="lastname" 
                                    value={this.state.lastname} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Location" 
                                    name="location" 
                                    value={this.state.location} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Occupation" 
                                    name="occupation" 
                                    value={this.state.occupation} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Description"
                                    name="description" 
                                    value={this.state.description} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Username" 
                                    name="newUsername" 
                                    value={this.state.newUsername} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Password" 
                                    type="password" 
                                    name="newPass" 
                                    value={this.state.newPass} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             <Grid item xs={12}>
                                <TextField 
                                    fullWidth 
                                    label="Confirm password" 
                                    type="password" 
                                    name="newPassConfirm" 
                                    value={this.state.newPassConfirm} 
                                    onChange={(e) => {this.handleRegisterChange(e)}}/>
                             </Grid>
                             {this.state.passMatch ? null : <Grid item xs={12}><Typography>Error! Passwords do not match</Typography></Grid>}
                             {this.state.regisSuccessful ? <Grid item xs={12}><Typography>Registration successful!</Typography></Grid> : null}
                             <Grid item xs={12}>
                                <Button 
                                    fullWidth 
                                    color="primary" 
                                    variant="contained"
                                    onClick={() => {this.handleNewRegister()}}>
                                        Register
                                </Button>
                             </Grid>
                             <Dialog
                                open={this.state.open}
                                onClose={() => {this.handleClose()}}

                             >
                                 <div className="dialog-container">
                                    {this.state.modalMessage}
                                 </div>
                             </Dialog>
                        </Grid>
                    </form>
                </div>
            </div>
        )
    }
}

export default LoginRegister;