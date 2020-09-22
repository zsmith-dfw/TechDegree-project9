const express = require('express');
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const Course = require("./models").Course;
const User = require("./models").User;

function asyncHandler(cb){
    return async (req,res, next) => {
        try {
            await cb(req, res, next);
        } catch(err) {
            next(err);
        }
    }
}

const authenticateUser = (req, res, next) => {
    let message = null;
  
    // Get the user's credentials from the Authorization header.
    const credentials = auth(req);
  
    if (credentials) {
      // Look for a user whose `username` matches the credentials `name` property.
      const user = User.findByPk(u => u.emailAddress === credentials.name);
  
      if (user) {
        const authenticated = bcryptjs
          .compareSync(credentials.pass, user.password);
        if (authenticated) {
          console.log(`Authentication successful for username: ${user.emailAddress}`);
  
          // Store the user on the Request object.
          req.currentUser = user;
        } else {
          message = `Authentication failure for username: ${user.emailAddress}`;
        }
      } else {
        message = `User not found for username: ${credentials.name}`;
      }
    } else {
      message = 'Auth header not found';
    }
  
    if (message) {
      console.warn(message);
      res.status(401).json({ message: 'Access Denied. Please try again' });
    } else {
      next();
    }
  };


  const router = express.Router();
// ------------------------------------------
//  USER ROUTES
// ------------------------------------------

// GET /api/users returns currently authenticated user STATUS 200

router.get('/api/users', authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddress: user.emailAddress
  });
});

// POST /api/users Creates a user, sets location header to "/" and returns no content STATUS 201

router.post('/api/users', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "first name"'),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "last name"'),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "email"'),
    check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "password"'),
],asyncHandler (async(req, res)=>{
      const user = await User.create(req.body)
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        const errorMessages = errors.array().map(error=>error.msg)
        return res.status(400).json({ errors: errorMessages });
      }
      user.password = bcryptjs.hashSync(user.password);
      return res.status(201).json(user).end(); 
}));




// ------------------------------------------
//  COURSE ROUTES
// ------------------------------------------

// GET /api/courses Returns a list of courses STATUS 200

// GET /api/courses/:id returns the course for provided ID STATUS 200

// POST /api/courses Creates a course, sets location header to URI for course STATUS 201

// PUT /api/courses/:id Updates a course and returns no content STATUS 204

// DELETE /api/courses/:id Deletes a course and returns no content STATUS 204
module.exports = router;



