// This file will handle connection to mongoDB database
const mongoose = require('mongoose');
const process = require('../db/envpass.json')
mongoose.Promise = global.Promise;

const connection = mongoose.connect(`mongodb+srv://task-manager:${process.env.MONGO_PASS_DB}@taskmanager.szcc8.mongodb.net/TaskManager?retryWrites=true&w=majority`, 

{ useNewUrlParser: true, useUnifiedTopology: true })

connection
    .then(() => {
        console.log("Connected to MongoDB successfully");
    })
    .catch(err => {
        console.log(err);
    })
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
    mongoose:mongoose
};

