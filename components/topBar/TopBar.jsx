import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, Dialog,
} from '@material-ui/core';
import './TopBar.css';
// import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

/**
 * Define TopBar, a React componment of CS142 project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      superUser: 'Julie',
      isLoggedIn: false,
      curLoc: this.props.history.location.pathname.split('/'),
      users: [],
      version: '',
      userInfo: {},
      open: false,
      modalMessage: ''
    }
    
    this.props.history.listen((location) => {
      this.setState({ curLoc: location.pathname.split('/') });
    })
  }

  componentDidMount() {
    let mypromise = axios.get('/user/list');
    mypromise.then((response) => {
      this.setState({ users: response.data })
    }).catch((err) => console.log(err));

    axios.get('/test/info').then((res) => {
      this.setState({ version: res.data.__v });
    }).catch((err) => console.log(err));

    axios.get('/userInfo').then((res) => {
      this.setState({ userInfo: {
        _id: res.data._id,
        first_name: res.data.first_name
      }, isLoggedIn: true })
    }).catch((err) => { 
      console.log(err);
      this.setState({ isLoggedIn: false });
    });
    
  }

  handleOnClick(e) {
    // log the user out
    let mypromise = axios.post('/admin/logout', {});
    mypromise.then(() => {
      window.location.replace("/photo-share.html#/login-register");
      window.localStorage.clear();
      window.location.reload();
      this.setState({ isLoggedIn: false });
    }).catch((err) => {
      console.log(err);
    })
    e.preventDefault();
  }

  handleUpload(e) {
    e.preventDefault();
    if (this.uploadInput.files.length > 0) {
      // Create a DOM form and add the file to it under the name uploadedphoto
      const domForm = new FormData();
      domForm.append('uploadedphoto', this.uploadInput.files[0]);
      axios.post('/photos/new', domForm).then((res) => {
        console.log(res);
        window.location.reload(); 
        document.getElementById('choose-file').value = "";
        this.handleOpen();
      }).catch((err) => {
        console.log(err);
        this.handleErrOpen(err);
      });      
    }
  }

  handleOpen() {
    this.setState({ modalMessage: 'Picture uploaded!' });
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }

  handleErrOpen(err) {
    this.setState({ modalMessage: err.response.data });
    this.setState({ open: true });
  }

  handleActivities() {
    window.location.replace('/photo-share.html#/activities');
  }
  
  render() {
    let message = this.state.isLoggedIn ? 'Hi, ' + this.state.userInfo.first_name : 'Please Login'
    
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar className='cs142-topbar-flex'>
          <Typography variant='h5' color='inherit'>
            {this.state.superUser}
          </Typography>
          <Typography>{message}</Typography>
          {this.state.isLoggedIn ? <Button onClick={(e) => {this.handleOnClick(e)}}>Log Out</Button> : null}
          {this.state.isLoggedIn ? <input id="choose-file" type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} /> : null}
          {this.state.isLoggedIn ? <Button id='upload-btn' onClick={(e) => {this.handleUpload(e)}}>Add Photo</Button> : null}
          {this.state.isLoggedIn ? <Button id='activities'onClick={() => {this.handleActivities()}}>Activities</Button> : null}
          
          <Typography>Version {this.state.version}</Typography>
          {this.state.users.map((i) => {
            if(i._id === this.state.curLoc[2]){
              return (
                <Typography 
                variant='h6' 
                key={i._id}>
                  {this.state.curLoc[1] === 'users' ? i.first_name : 'Photos of ' + i.first_name}
                </Typography>
              )
            }
          })}     
        </Toolbar>
        <Dialog
          open={this.state.open}
          onClose={() => this.handleClose()}
        >
          <div className="topBar-dialog-container">
              <Typography>{this.state.modalMessage}</Typography>
          </div>
        </Dialog>
      </AppBar>
    );
  }
}

export default TopBar;
