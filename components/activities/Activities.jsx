import React from 'react';
import {
  Typography, Divider, Button,
} from '@material-ui/core';
import './Activities.css';
import axios from 'axios';

class Activities extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
          loading: true,
          acts: [],
          errorMes: '',
      }

    }

    componentDidMount() {
        axios.get('/activities').then((res) => {
            console.log(res.data);
            this.setState({ loading: false, acts: res.data });
        }).catch((err) => {
            console.log("NO ACTIVITIES YET");
            this.setState({ loading: false, acts: [], errorMes: err.response.data });
        });
    }

    handleOnClick() {
        axios.get('/activities').then((res) => {
            console.log('Reloaded successfully');
            this.setState({ loading: false, acts: res.data });
        }).catch((err) => {
            console.log("NO ACTIVITIES YET");
            this.setState({ loading: false, acts: [], errorMes: err.response.data });
        });
    }

    render() {
        console.log('ONE' + this.state.acts);
        return (
            <div>
                {this.state.loading ? 
                    <Typography>Loading...</Typography>
                :
                <div className='acts-container'>
                    {console.log('HERE')}
                    <Button onClick={(e) => {this.handleOnClick(e)}}>Refresh</Button>
                    
                    {this.state.acts.map((i) => {
                        return (
                            <div className='activity-box' key={i.key}>
                                <Typography>Activity Type: {i.activity_type}</Typography>
                                <Typography>Author name: {i.first_name}</Typography>
                                <Typography variant='caption'>Time: {i.date_time}</Typography>
                                
                                {i.file_name === null ? 
                                    null
                                :
                                    <img className='act-img' src={'./../../images/' + i.file_name} alt='activity thumbnail'/>
                                }
                                <Divider/>
                            </div>
                        )              
                    })}
                </div>            
                }

            </div>
        )
    }
}

export default Activities;