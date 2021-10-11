import React from 'react';
import ReactDOM from 'react-dom';

import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Typography, Paper
} from '@material-ui/core';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import LoginRegister from './components/userLogin/LoginRegister';
import Activities from './components/activities/Activities';
import axios from 'axios';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    // this.isLoggedIn = sessionStorage.getItem('isLoggedIn');
    this.state = {
      isLoggedIn: window.localStorage.getItem('isLoggedIn'),
      users: [],
    }
  }

  componentDidMount() {
    axios.get('/userInfo').then(() => {
      this.setState({ isLoggedIn: true });
      this.render();
    }).catch((err) => { 
      console.log(err);
      this.setState({ isLoggedIn: false });
    });

    // get all users and store in state
    let users = axios.get('/user/list');
    users.then((response) => {
      console.log(response.data);
      let usersList = [];
      for (let i = 0; i < response.data.length; i++) {
        let userObj = {
          id: response.data[i]._id,
          display: response.data[i].first_name,
        };
        usersList.push(userObj);
      }
      this.setState({ users: usersList });
    }).catch((err) => console.log(err));
  }

  // uploadHandler() {
  //   this.setState({ photoUploaded: !this.state.photoUploaded });
  // }

  render() {
  
    console.log(this.state.isLoggedIn);
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <Route render ={ props => <TopBar {...props} /> } />
        </Grid>
        
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper  className="cs142-main-grid-item">
            <UserList />
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item">
            <Switch>
              { 
                this.state.isLoggedIn ? 
                  <Route exact path="/"  render={() => <Typography>Welcome to the photo-sharing app!</Typography>} /> 
                : 
                  <Redirect exact path="/" to="/login-register" />
              }

              { 
                this.state.isLoggedIn ? 
                  <Route path="/activities" render={ props => <Activities {...props} /> } /> 
                : 
                  <Redirect path="/activities" to="/login-register" />
              }

              { 
                this.state.isLoggedIn ? 
                  <Route path="/photos/:userId" render={ props => <UserPhotos {...props} users={this.state.users}/> } /> 
                : 
                  <Redirect path="/photos/:userId" to="/login-register" />
              }
                
              {
                this.state.isLoggedIn ? 
                <Route path="/users/:userId" render={ props => <UserDetail {...props} /> } /> 
                : 
                  <Redirect path="/users/:userId" to="/login-register" />
              }
              
              {
                this.state.isLoggedIn ?
                <Route path="/users" component={UserList} />
                :
                  <Redirect path="/users" to="/login-register" />
              }

              {
                this.state.isLoggedIn ?
                <Route path="/photos"/>
                :
                  <Redirect path="/photos" to="/login-register" />
              }


              <Route path="/login-register" component={LoginRegister} />
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
    </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
