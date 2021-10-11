import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  Avatar,
  Divider,
  Grid,
  Typography,
} from '@material-ui/core';
import './userPhotos.css';
import { MentionsInput, Mention } from 'react-mentions'
// import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.match.params.userId,
      userPhotos: [],
      updated: false,
      users: [],
      comments: [],
      mentionedUsers: [],
    };
  }

  componentDidMount() {
    console.log("USER PHOTOS MOUNTED");
    let mypromise = axios.get('/photosOfUser/' + this.state.userId);
    mypromise.then((response) => {
      this.setState({ userPhotos: response.data, comments: new Array(response.data.length) })
    }).catch((err) => console.log(err));
  }

  handleSubmit(e, photoId, index) {
    console.log(this.state.comments[index]); // raw text comment
    
    if (this.state.mentionedUsers.length !== 0) {
      let mention = axios.post('/userMention', {mentionedArray: this.state.mentionedUsers, photo_id: photoId});
      mention.then((res) => {
        console.log(res);
      }).catch((err) => {
        console.log(err);
      });
      this.setState({ mentionedUsers: [] });
    }
    
    let comments = [...this.state.comments];
    let str = {...comments[index]};
    str = this.state.comments[index];

    for (let i = 0; i < this.state.mentionedUsers.length; i++) {
      console.log(str);
      let newStr = '@' + this.state.mentionedUsers[i].display;
      str = str.replace('@[' + this.state.mentionedUsers[i].display + '](' + this.state.mentionedUsers[i].id + ')', newStr);
      console.log(str);
    }

    // add comment to photo and rerender photosOfUser
    let mypromise = axios.post('/commentsOfPhoto/' + photoId, {comment: str});
    mypromise.then((res) => {
      console.log(res);
      this.setState({ updated: !this.state.updated });
      let mypromise2 = axios.get('/photosOfUser/' + this.state.userId);
      mypromise2.then((response) => {
        this.setState({ userPhotos: response.data })
      }).catch((err) => console.log(err));
    }).catch((err) => {
      console.log(err);
    });
    e.target.value = "";

    comments[index] = '';
    this.setState({ comments });
    
  }

  handleChange(e, index) {
    let comments = [ ...this.state.comments ];
    let comment = {...comments[index]};
    comment = e.target.value;
    comments[index] = comment;
    this.setState({ comments });
  }

  checkMention(id, display) {
    console.log(id);
    this.setState({ mentionedUsers: [...this.state.mentionedUsers, {id, display}] });
  }

  render() {
    return (
      <div className='container'>
        {this.state.userPhotos.map((i, index) => {
          return (
            <div key={i._id} className='card-holder'>
            
            <Card className='card' id={i._id}>
              <CardHeader subheader={'Posted on ' + JSON.stringify(i.date_time).substring(1, 11) 
                + ' ' + JSON.stringify(i.date_time).substring(12, 20)} />
                <CardMedia 
                  component='img'
                  height='100%'
                  image={'./../../images/' + i.file_name}
                />
              <CardContent>
                {i.comments.length == 0 ? <Typography>No comments</Typography> : i.comments.map((cur) => {
                  return (
                    <div key={cur._id}>
                      <Divider variant="fullWidth" className='divider' style={{ margin: "30px 0" }} />  
                      <Grid container wrap='nowrap' spacing={2} >
                        <Grid item>
                          <Avatar />
                        </Grid>
                        <Grid item xs zeroMinWidth>
                          <Typography 
                            variant='h6' 
                            className='namePlaceholder' 
                            component={Link} 
                            to={'/users/' + cur.user.user_id}>
                              {cur.user.first_name}
                            </Typography>
                          <Typography>{cur.comment}</Typography>
                          <Typography variant='caption' className='timestamp'>{JSON.stringify(cur.date_time).substring(1, 11) 
                            + ' ' + JSON.stringify(cur.date_time).substring(12, 20)}</Typography>
                        </Grid>
                      </Grid>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
            <div className="comment-container">
                {/* <TextField 
                    fullWidth 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        this.handleSubmit(e, i._id)
                        e.preventDefault();
                      }
                    }}
                    label="Write a comment"
                    size="small"
                    // value={this.state.newComment}
                    // onChange={(e) => {this.handleChange(e)}}
                  /> */}
                <MentionsInput 
                  value={this.state.comments[index]} 
                  onChange={(e) => this.handleChange(e, index)}
                  placeholder='Write a comment'
                  className='mentions'
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      this.handleSubmit(e, i._id, index)
                      e.preventDefault();
                    }
                  }}
                >
                  <Mention
                    trigger="@"
                    data={this.props.users}
                    className='input'
                    onAdd={(id, display) => this.checkMention(id, display)}
                    // renderSuggestion={this.renderUserSuggestion}
                  />
              </MentionsInput>
                  
            </div>
          </div>
          )
        })}
      </div>
    );
  }
}

export default UserPhotos;
