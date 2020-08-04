const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {mongoose} = require('./db/mongoose');

// Load in mongoose modules
const {List, Task} = require('./db/modules/index');

// load middleware
app.use(bodyParser.json())

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get('/lists', (req, res) => {
    // We want to return an arry of all the list from DB
    List.find({})
        .then(lists =>{
            res.send(lists)
        })
        .catch()
})

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post('/lists', (req, res) => {
    // We want to create a new list and return new list document back to the user which includes the id
    // The list information (fields) will be passed via JSON request body
    let title = req.body.title;
    let newList = new List({
        title:title
    })
    newList
        .save()
        .then(listDoc=>{
            // The full list document is returned (incl. id)
            res.send(listDoc);
        })
        .catch(err=>{
            console.log(err);
        })

})

/**
 * PATCH /lists
 * Purpose: Update a specified lists
 */
app.patch('/lists/:id', (req, res) => {
    // We want to update specified list (list document with id in the URL) with the new values specified in JSON body of the request

})

/**
 * DELETE /lists
 * Purpose: Delete a lists
 */
app.delete('/lists/:id', (req, res) => {
    // We want to delete specified list (list document with id in the URL) with the new values specified in JSON body of the request

})

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
})