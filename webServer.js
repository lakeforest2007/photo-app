"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */


var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var Activity = require('./schema/activities.js');

var express = require('express');
var app = express();

const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
const fs = require('fs');
// const { StayCurrentPortraitRounded } = require('@material-ui/icons');
// const { strict } = require('assert');

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    // find data requested in database
    User.find({}, function (err, info) {
        // if not found/other --> throw errors
        if (err) {
            console.error('Doing /user/list error: ', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info.length === 0) {
            response.status(500).send('Missing User');
            return;
        }
        // if found --> send response
        let list = [];
        for (let i = 0; i < info.length; i++) {
            let user = {
                _id: info[i]._id,
                first_name: info[i].first_name,
                last_name: info[i].last_name,
            };
            list.push(user);
        }
        response.status(200).send(list);
    });
    console.log('User objects found and sent successfully');
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    let userId = request.params.id;
    User.findOne({_id: userId}, function(err, user) {
        if (err) {
            console.error('Doing /user/:id error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user === null) { 
            console.log('User with _id:' + userId + ' not found.');
            response.status(400).send('Not found');
            return;
        }
        let userObj = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            location: user.location,
            description: user.description,
            occupation: user.occupation,
        };
        response.status(200).send(userObj);
    });
    console.log('User details with _id' + userId + ' found and sent');
    // var id = request.params.id;
    // var user = cs142models.userModel(id);
    // if (user === null) {
    //     console.log('User with _id:' + id + ' not found.');
    //     response.status(400).send('Not found');
    //     return;
    // }
    // response.status(200).send(user);
    // Activity.remove({}, function(err) { 
    //     console.log('collection removed') 
    //  });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    let id = request.params.id;
    Photo.find({user_id: id}, function(err, photoData) {
        if (err) {
            console.error('Doing /photosOfUser/:id error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photoData === null) { 
            console.log('Photos for user with _id: ' + id + 'not found');
            response.status(400).send('Not found');
            return;
        }

        let photos = JSON.parse(JSON.stringify(photoData));

        let list = [];
        for (let i = 0; i < photos.length; i++) {
            let commentsArr = [];
            for (let j = 0; j < photos[i].comments.length; j++) {
                let comment = {
                    _id: photos[i].comments[j]._id,
                    user: {
                        _id: photos[i].comments[j].user_id
                    },
                    date_time: photos[i].comments[j].date_time,
                    comment: photos[i].comments[j].comment,
                };
                commentsArr.push(comment);
            }
            
            let photoObj = {
                _id: photos[i]._id,
                user_id: photos[i].user_id,
                comments: commentsArr,
                file_name: photos[i].file_name,
                date_time: photos[i].date_time,
            };
            list.push(photoObj);
        }
        
        function addUserName(photoFile, callbackOne) {
            async.each(photoFile.comments, function(commentFile, subCallback){
                User.findOne({_id: commentFile.user._id}, function(err, commenter){
                    if (err) {
                        subCallback(err);
                    } else {
                        console.log(commenter);
                        let userObj = {
                            user_id: commenter._id,
                            first_name: commenter.first_name,
                            last_name: commenter.last_name
                        }
                        commentFile.user = userObj;
                        subCallback();
                    }
                })
            }, function(err){
                if (err) {
                    callbackOne(err)
                } else {
                    console.log('Comments for photo with id' + photoFile._id + ' sent');
                    callbackOne();
                }
            });
        }

        async.each(list, addUserName, function(err){
            if (err) {
                console.log('Details for user with _id: ' + id + 'not found');
                response.status(400).send(JSON.stringify(err));
            } else {
                console.log("Photos of user with id: " + id + " sent");
                response.status(200).send(list);
            }
        });
    });

    // var id = request.params.id;
    // var photos = cs142models.photoOfUserModel(id);
    // if (photos.length === 0) {
    //     console.log('Photos for user with _id:' + id + ' not found.');
    //     response.status(400).send('Not found');
    //     return;
    // }
    // response.status(200).send(photos);
});

app.post('/admin/login', function(request, response) {
    console.log("BODY: " + JSON.stringify(request.body));
    let body = JSON.parse(JSON.stringify(request.body));
    let username = body.login_name;
    console.log("USERNAME:" + username);
    let pass = body.password;
    
    User.findOne({login_name: username}, function(err, info) {
        if (err) {
            console.error('Doing /admin/login error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (info === null) {
            console.log('Username not found.');
            response.status(400).send('Username not found');
            return;
        }
        if (info.password !== pass) {
            console.log('Passwords do not match');
            response.status(400).send('Wrong password');
            return;
        }
        let firstName = info.first_name;
        let timestamp = new Date().valueOf()
        let newAct = {
            activity_type: 'User Logged In',
            first_name: firstName,
            date_time: timestamp,
            file_name: null,
            key: 'User Logged In' + firstName + JSON.stringify(timestamp),
        }
        Activity.create(newAct, function(err){
            if (err) {
                console.error('Error occurred while adding a new activity: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            request.session.user_id = info._id;
            request.session.first_name = info.first_name;
            request.session.login_name = info.login_name;
            response.status(200).send({
                _id: info._id,
            })
        });    
    });
});

// returns the information of current logged-in user
app.get('/userInfo', function(request, response) {
    if (request.session.user_id === undefined || request.session.user_id === null) {
        response.status(401).send('User unathorized.');
        return;
    }
    let userInfo = {
        _id: request.session.user_id,
        first_name: request.session.first_name
    }
    response.status(200).send(userInfo);
});

app.post('/admin/logout', function(request, response){
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(400).send('Unauthorized User.');
        return;
    }
    User.findOne({_id: request.session.user_id}, function(err, user){
        if (err) {
            console.error('Doing /admin/logout error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user === null) { 
            console.log('User with not found.');
            response.status(400).send('Not found');
            return;
        }
        let firstName = user.first_name;
        let timestamp = new Date().valueOf()
        let newAct = {
            activity_type: 'User Logged Out',
            first_name: firstName,
            date_time: timestamp,
            file_name: null,
            key: 'User Logged out' + firstName + JSON.stringify(timestamp),
        }
        Activity.create(newAct, function(err){
            if (err) {
                console.error('Error occurred while adding a new activity: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            request.session.destroy(function (err) {console.log(err);});
            response.status(200).send('Logged out!');
        });
    });
});

app.post('/commentsOfPhoto/:photo_id', function(request, response){
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    if (request.body.comment.length === 0) {
        response.status(400).send('Empty comment received');
        return;
    }
    let photo_id = request.params.photo_id;
    let cur_date = new Date();
    let timestamp = cur_date.toISOString();
    let comment_obj = {
        user_id: request.session.user_id,
        date_time: timestamp,
        comment: request.body.comment,
    }

    Photo.findOne({_id: photo_id}, function(err, photo){
        if (err) {
            console.error('Doing /commentsOfPhoto/:photo_id error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            console.log('Photo not found');
            response.status(400).send('Not found');
            return;
        }
        photo.comments.push(comment_obj);
        console.log("new comment pushed to photo!");
        // response.status(200).send('Photo updated with new comment');
    
        Photo.findOneAndUpdate({_id: photo_id}, {comments: photo.comments}, {new: true, useFindAndModify: false}, function(err){
            if (err) {
                console.error('Error when adding comments object: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            User.findOne({_id: request.session.user_id}, function(err, user){
                if (err) {
                    console.error('Doing /photos/new error: ', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                if (user === null) { 
                    console.log('User with not found.');
                    response.status(400).send('Not found');
                    return;
                }
                let firstName = user.first_name;
                let timestamp = new Date().valueOf()
                let newAct = {
                    activity_type: 'User Commented',
                    first_name: firstName,
                    date_time: timestamp,
                    file_name: photo.file_name,
                    key: 'User Commented' + firstName + JSON.stringify(timestamp),
                }
                Activity.create(newAct, function(err){
                    if (err) {
                        console.error('Error occurred while adding a new activity: ', err);
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    console.log("new comment added to backend!");
                    console.log(photo.comments);
                    response.status(200).send('New comment added');
                });
            });
        })
    });
});

app.post('/photos/new', function(request, response){
    let sess_user_id = request.session.user_id;
    console.log(sess_user_id);
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    processFormBody(request, response, function(err){
        if (err || !request.file) {
            // Insert error handling here
            console.log('Error occurred while processing photo');
            response.status(400).send(JSON.stringify(err));
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        if (request.file.fieldname !== 'uploadedphoto') {
            console.log('Incorrect fieldname');
            response.status(400).send('Incorrect fieldname');
            return;
        }
        let type = request.file.mimetype;
        if (type.substr(type.length - 4) !== 'jpeg' && type.substr(type.length - 3) !== 'png'
            && type.substr(type.length - 3) !== 'jpg') {
            console.log(type.substr(type.length - 4) );
            response.status(400).send('File media type must be jpeg or png');
            return;
        }

        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        const timestamp = new Date().valueOf();
        const filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
        // Once you have the file written into your images directory under the name
        // filename you can create the Photo object in the database
            if (err) {
                console.error('Write file error: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            let newPhoto = {
                date_time: timestamp,
                file_name: filename,
                user_id: request.session.user_id,
                comments: []
            } 
            
            Photo.create(newPhoto, function(err){
                if (err) {
                    console.error('Error occurred while adding a new photo: ', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                let user_name;
                User.findOne({_id: request.session.user_id}, function(err, user){
                    if (err) {
                        console.error('Doing /photos/new error: ', err);
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    if (user === null) { 
                        console.log('User with not found.');
                        response.status(400).send('Not found');
                        return;
                    }
                    user_name = user.first_name;
                    let newAct = {
                        activity_type: 'Photo Upload',
                        first_name: user_name,
                        date_time: timestamp,
                        file_name: filename,
                        key: 'Photo Upload' + user_name + JSON.stringify(timestamp),
                    }
                    console.log(newAct.key);
                    Activity.create(newAct, function(err){
                        if (err) {
                            console.error('Error occurred while adding a new activity: ', err);
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        response.status(200).send("Photo successfully added");
                    });
                });
            });
        });
    });
});

app.post('/user', function(request, response){
    let firstName = request.body.first_name;
    let lastName = request.body.last_name;
    let pass = request.body.password;
    let username = request.body.login_name;
    console.log(username);
    
    if (firstName.length === 0) {
        response.status(400).send('First name is empty');
        return;
    }
    if (lastName.length === 0) {
        response.status(400).send('Last name is empty');
        return;
    }    
    if (pass.length === 0) {
        response.status(400).send('Password is empty');
        return;
    }
    if (username.length === 0) {
        response.status(400).send('Username is empty');
        return;
    }

    // make sure the new login_name is unique
    User.find({login_name: username}, function(err, info){
        if (err) {
            console.log('ONE');
            console.error('Doing /user error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        console.log(info);
        if (info.length !== 0) {
            console.log('TWO');
            response.status(400).send('Username already exists');
            return;
        }
        let newUserObj = {
            first_name: firstName,
            last_name: lastName,
            occupation: request.body.occupation,
            location: request.body.location,
            description: request.body.description,
            login_name: request.body.login_name,
            password: pass,
        }
        User.create(newUserObj, function(err){
           if (err) {
                console.log('THREE');
                console.error('Adding new user error: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
           } 
           console.log('FOUR');
           let timestamp = new Date().valueOf()
           let newAct = {
                activity_type: 'User Registered',
                first_name: firstName,
                date_time: timestamp,
                file_name: null,
                key: 'User Registered' + firstName + JSON.stringify(timestamp),
            }
            Activity.create(newAct, function(err){
                if (err) {
                    console.error('Error occurred while adding a new activity: ', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                response.status(200).send('User registration successful');
            });
        });
    });
});

// **************************************************************************** //

app.get('/userPhotoStats/:id', function(request, response){
    let sess_user_id = request.session.user_id;
    
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    let id = request.params.id;
    Photo.find({user_id: id}, function(err, photos) {
        if (err) {
            console.error('Doing /photosOfUser/:id error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photos === null) { 
            console.log('Photos for user with _id: ' + id + 'not found');
            response.status(400).send('Not found');
            return;
        }
        if (photos.length === 0) {
            console.log('Photos for user with _id: ' + id + 'not found');
            response.status(400).send('User has no photos yet');
            return;
        }
        // find most recent photo
        let mostRecentTime = photos[0].date_time;
        let mostRecentPhoto = photos[0].file_name;
        let maxComments = photos[0].comments.length;
        let popularPhoto = photos[0].file_name;
        for (let i = 0; i < photos.length; i++) {
            if (photos[i].date_time > mostRecentTime) {
                mostRecentTime = photos[i].date_time;
                mostRecentPhoto = photos[i].file_name;
            }
            if (photos[i].comments.length > maxComments) {
                maxComments = photos[i].comments.length;
                popularPhoto = photos[i].file_name;
            }
        }

        let photoStatsObj = {
            time: mostRecentTime,
            recentFile: mostRecentPhoto,
            num: maxComments,
            popularFile: popularPhoto,
        }

        response.status(200).send(photoStatsObj);
    });
    console.log('Most recent and popular photos sent');
});

app.get('/activities', function(request, response){
    let sess_user_id = request.session.user_id;
    
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    // sort and get the top 5 recent activities
    Activity.find({}).sort({date_time: -1}).limit(5).exec(function(err, acts){
        if (err) {
            console.error('Doing /activities error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (acts === null) { 
            console.log('Activities not found');
            response.status(400).send('Not found');
            return;
        }
        if (acts.length === 0) {
            console.log('No activities');
            response.status(400).send('There are no recent activities yet.');
            return;
        }
        console.log(acts);
        console.log('Top 5 recent activities returned successfully');
        response.status(200).send(acts);
    });
});

app.post('/userMention', function(request, response){
    let sess_user_id = request.session.user_id;
    
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    
    let mentionedArray = request.body.mentionedArray;
    console.log('TEST MentionedArray: ' + mentionedArray);
    let array = [];
    for (let i = 0; i < mentionedArray.length; i++) {
        array.push(mentionedArray[i].id);
        console.log('PUSHED A MENTION')
    }
    let photoId = request.body.photo_id;

    console.log('array: ' + array);
    Photo.findOne({_id: photoId}, function(err, photo){
        console.log('FINDING A PHOTO')
        if (err) {
            console.error('Doing /userMention error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            console.log('Photo not found');
            response.status(400).send('Not found');
            return;
        }
        console.log(photo.mentions);

        for (let i = 0; i < array.length; i++) {
            photo.mentions.push(array[i]);
        }
        console.log("new user mentions pushed to photo!");

        Photo.findOneAndUpdate({_id: photoId}, {mentions: photo.mentions}, {new: true, useFindAndModify: false}, function(err){
            if (err) {
                console.error('Error when adding mentions object: ', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log("new mentions added to backend!");
            console.log(photo.mentions);
            response.status(200).send('New mentions added');
        })
    });

});

app.get('/mentionedPhotos/:id', function(request, response){
    let sess_user_id = request.session.user_id;
    
    if (sess_user_id === undefined || sess_user_id === null) {
        response.status(401).send('User unauthorized.');
        return;
    }
    let userId = request.params.id;
    Photo.find({}, function(err, photos) {
        if (err) {
            console.error('Doing /mentionedPhotos/:id error: ', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photos === null) { 
            console.log('Photos with user mentions not found');
            response.status(400).send('Not found');
            return;
        }
        if (photos.length === 0) {
            console.log('Photos for user not found');
            response.status(400).send('User has not been mentioned yet');
            return;
        }
        // loop through photos and get all photos that mentions array that contains userId
        let ret = [];
        let idx = 0;
        for (let i = 0; i < photos.length; i++) {
            let curArr = photos[i].mentions;
            if (curArr.includes(userId)) {
                let obj = {
                    _id: photos[i]._id,
                    photoId: idx,
                    user_id: photos[i].user_id,
                    author: photos[i].user_id,
                    img: photos[i].file_name,
                }
                idx += 1;
                ret.push(obj);
            }
        }

        function addUserName(obj, callbackOne) {
            User.findOne({_id: obj.author}, function(err, poster){
                if (err) {
                    callbackOne(err);
                } else {
                    obj.author = poster.first_name + ' ' + poster.last_name;
                    callbackOne();
                }
            })    
        }

        async.each(ret, addUserName, function(err){
            if (err) {
                console.log(JSON.stringify(err));
                response.status(400).send(JSON.stringify(err));
            } else {
                console.log("Photos mention of user sent");
                response.status(200).send(ret);
            }
        });
    });
})

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


