"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a recent activity
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create a schema
var activitySchema = new mongoose.Schema({
    activity_type: String, // Type of activity
    first_name: String, // First name of the user that performed activity
    last_name: String,  // Last name of the user.
    date_time: {type: Date, default: Date.now},
    file_name: String,
    key: String,
});

// the schema is useless so far
// we need to create a model using it
var Activity = mongoose.model('Activity', activitySchema);

// make this available to our users in our Node applications
module.exports = Activity;