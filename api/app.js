const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');

// Load in mongoose modules
const { List, Task } = require('./db/modules/index');

// load middleware
app.use(bodyParser.json())

// CORS HEADER MIDDLEWARE
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get('/lists', (req, res) => {
    // We want to return an arry of all the list from DB
    List.find({})
        .select('_id title')
        .then(lists => {
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
        title: title
    })
    newList
        .save()
        .then(listDoc => {
            // The full list document is returned (incl. id)
            res.send(listDoc);
        })
        .catch(err => {
            console.log(err);
        })

})

/**
 * PATCH /lists
 * Purpose: Update a specified lists
 */
app.patch('/lists/:id', (req, res) => {
    // We want to update specified list (list document with id in the URL) with the new values specified in JSON body of the request
    List.findOneAndUpdate({
        _id: req.params.id
    }, {
        $set: req.body
    })
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.log(err);
        })
})

/**
 * DELETE /lists
 * Purpose: Delete a lists
 */
app.delete('/lists/:id', (req, res) => {
    // We want to delete specified list (list document with id in the URL) with the new values specified in JSON body of the request
    List.findOneAndRemove({
        _id: req.params.id
    })
        .then((removedListDoc) => {
            res.send(removedListDoc).json({
                message: "Requested item has been deleted"
            })
        })
        .catch((err) => {
            console.log(err);
        })
});

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks assigned to specific list
 */
app.get('/lists/:listId/tasks', (req, res) => {
    // We want to return all task which belongs to specific list
    Task.find({
        _listId: req.params.listId
    })
        .then((tasks) => {
            res.send(tasks)
        })
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task within a specified list
 */
app.post('/lists/:listId/tasks', (req, res) => {
    // We want to create new task in specified list (specified by id)
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId
    })
    newTask
        .save()
        .then((newTaskDoc) => {
            res.send(newTaskDoc)
        })
        .catch((err) => {
            console.log(err);
        })
});


/**
 * PATCH /lists/:listId/tasks
 * Purpose: Update a task within a specified list
 */
app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    }, {
        $set: req.body

    })
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.log(err);
        })
});

/**
 * DELETE /lists/:listId/tasks
 * Purpose: Delete a task within a specified list
 */
app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    })
        .then(() => {
            // res.sendStatus(200);
            res.status(200).json({
                message:"Requested item has been "
            })
        })
        .catch(err => {
            console.log(err);
        })
});



app.listen(3000, () => {
    console.log('Server is listening on port 3000');
})