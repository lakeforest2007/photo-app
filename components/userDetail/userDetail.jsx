import React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Typography
} from '@material-ui/core';
import { NavLink } from 'react-router-dom'
import { NavHashLink } from 'react-router-hash-link';
import './userDetail.css';
// import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      userId: this.props.match.params.userId,
      userDetail: [],
      recentDate: '',
      recentImg: '',
      numComments: null,
      popularImg: '',
      mentionedPhotos: [],
    };
   
  }

  getUserDetailPhoto() {
    let myPromise = axios.get('/userPhotoStats/' + this.state.userId);
    myPromise.then((res) => {
      console.log(res.data);
      this.setState({ 
        recentDate: res.data.time,
        recentImg: res.data.recentFile,
        numComments: res.data.num,
        popularImg: res.data.popularFile, 
      });
    }).catch((err) => {
      console.log(err);
      this.setState({
        recentDate: '',
        recentImg: '',
        numComments: null,
        popularImg: '', 
      });
    });
  }

  getMentionedPhotos() {
    let photos = axios.get('/mentionedPhotos/' + this.state.userId);
    photos.then((res) => {
      console.log(res);
      this.setState({ mentionedPhotos: res.data });
    }).catch((err) => {
      console.log(err);
      this.setState({ mentionedPhotos: [] });
    });
  }

  componentDidMount() {
    this.setState({ loading: true}, () => {
      axios.get('/user/' + this.state.userId).then((resp) => {
        this.setState({ loading: false, userDetail: resp.data })
      }).catch((err) => console.log(err))
    });
    this.getUserDetailPhoto();
    this.getMentionedPhotos();
  }

  componentWillUnmount() {
    this.setState({ mentionedPhotos: [] });
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.userId != prevProps.match.params.userId) {
      this.setState({ loading: true, userId: this.props.match.params.userId }, () =>
      {axios.get('/user/' + this.props.match.params.userId).then((resp) => {
        this.setState({ loading: false, userDetail: resp.data })
      }).catch((err) => console.log(err));
      
      this.getUserDetailPhoto();
      this.getMentionedPhotos();
    });

    }

  }

  render() {

    return (
      <div>
        {this.state.loading ? '' : 
          <div>
            <div className='userHdr'>
              <Typography variant='h4'>{this.state.userDetail.first_name + ' ' + this.state.userDetail.last_name}</Typography> 
              <Button 
                variant='outlined' 
                component={Link} to={'/photos/' + this.state.userId}>
                  View Photos
              </Button>

            </div>
            <Typography variant='body2'><b>Description: </b>{this.state.userDetail.description}</Typography>
            <Typography variant='body2'><b>Location: </b>{this.state.userDetail.location}</Typography>
            <Typography variant='body2'><b>Occupation: </b>{this.state.userDetail.occupation}</Typography>
            
            {this.state.recentImg ? 
              <div className='recent-container'>
              <Typography variant='h6'>Most Recent Photo</Typography>
              <Typography variant='body2'><b>Time uploaded: </b>{JSON.stringify(this.state.recentDate).substring(1, 11) 
                + ' ' + JSON.stringify(this.state.recentDate).substring(12, 20)}</Typography>
              <NavLink to={'/photos/' + this.state.userId}>
                <img src={'./../../images/' + this.state.recentImg} alt='thumbnail1' />
              </NavLink>
              
              </div>
              :
              null
            }
            
            {this.state.popularImg ?
              <div className='popular-container'>
                <Typography variant='h6'>Most Commented Photo</Typography>
                <Typography variant='body2'><b>Number of Comments: </b>{this.state.numComments}</Typography>
                <NavLink to={'/photos/' + this.state.userId}>
                  <img src={'./../../images/' + this.state.popularImg} alt='thumbnail2' />
                </NavLink>
              </div>
              :
              null
            }

            {this.state.mentionedPhotos.length !== 0 ?
              <div>
                <Typography variant='h6'>Mentioned in</Typography>
                  <div className='mentioned-container'>
                    {this.state.mentionedPhotos.map((i) => {
                      return (
                        <div key={i.photoId} className='thumbnail-box'>
                          <NavLink to={'/users/' + i.user_id}>
                            <Typography variant='body2'><b>Author of Photo: </b>{i.author}</Typography> 
                          </NavLink>

                          <NavHashLink
                            to={"/photos/" + i.user_id + "#" + i._id}
                          >
                            <img src={'./../../images/' + i.img} alt='mentioned' />
                          </NavHashLink>
                          
                        </div> 
                      )

                    })}
                  </div>
              </div>
              :
              null
            }            
          </div>
        }
      </div>
      
    );
  }
}

export default UserDetail;
