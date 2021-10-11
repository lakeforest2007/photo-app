import React from 'react';
import { Link } from "react-router-dom";
import {
  Divider,
  List,
  ListItem,
  ListItemText,
}
from '@material-ui/core';
import './userList.css';
// import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
      isLoggedIn: false,
    }
  }

  componentDidMount() {
    let mypromise = axios.get('/user/list');
    mypromise.then((response) => {
      this.setState({ users: response.data })
    }).catch((err) => {
      console.log(err); 
    });
  }

  render() {
    let isLoggedIn;
    if (window.localStorage.getItem('isLoggedIn')) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    return (
      <div>
        {isLoggedIn ? 
          <List component="nav">
            {this.state.users.map((i) => {
                return (
                <div key={i._id}>     
                  <ListItem className="user" component={Link} to={'/users/' + i._id} >
                    <ListItemText primary={i.first_name}/>
                  </ListItem>
                  <Divider />
                </div>
                )
            })}
          </List>
          :
          null
        }
        
      </div>
    );
  }
}

export default UserList;
