const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose= require('./db/mongoose');
const crypt = require('crypto');

// Load in mongoose modules
const {
    List,
    Task,
    User
} = require('./db/modules/index');

/* MIDDLEWARE */

// Load middleware
app.use(bodyParser.json())

// CORS HEADER MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    res.header('Access-Control-Expose-Headers','x-access-token, x-refresh-token');
    next();
});


// verify refresh Token middleware (which will be verifying session)

let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}
/* END MIDDLEWARE */


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
        .catch(err => {
            console.log(err);
        })
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
        .catch((err) => {
            console.log(err);
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
            res.send({
                message: "Updated successfully"
            });
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
                message: "Requested item has been "
            })
        })
        .catch(err => {
            console.log(err);
        })
});



/* USER ROUTES */

/**
 * POST /users
 * Purpose: sign up
 */

app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
});
/**
 * POST /users/login
 * Purpose: Login route
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    User.findByCredentials(email,password)
        .then((user)=>{
            return user.createSession()
            .then((refreshToken)=>{
                // session has been created successfully - refresh token returned
                // generate an access to auth token for the user

                return user.generateAccessAuthToken().then((accessToken)=>{
                    return {accessToken,refreshToken}
                })

            })
            .then((authToken)=>{
                res
                .header('x-refresh-token', authToken.refreshToken)
                .header('x-access-token', authToken.accessToken)
                .send(user)
            })
            .catch((err)=>{
                res.status(400).send(err)

            })
    })
})



/*
 * GET /users/me/access-token
 * Purpose: generates and return an access token
 */
app.get('/users/me/access-token',verifySession,(req,res)=>{
    // we know that the user caller is authenticated and we have a user_id and user object avaiable to us
    req.userObject.generateAccessAuthToken()
        .then((accessToken)=>{
            res.header('x-access-token',accessToken).send({accessToken})
        })
        .catch((e)=>{
            res.status(400).send(e);
        })

});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
})