const express = require("express");
const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");

const Course = require("./models").Course;
const User = require("./models").User;

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

const authenticateUser = async (req, res, next) => {
  let message = null;
  const credentials = auth(req);

  if (credentials) {
    const user = await User.findOne({
      where: { emailAddress: credentials.name },
    });

    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );
      if (authenticated) {
        console.log(`Authentication successful for username: ${user.username}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = "Auth header not found";
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: "Access Denied. Please try again" });
  } else {
    next();
  }
};

const router = express.Router();
// ------------------------------------------
//  USER ROUTES
// ------------------------------------------

// GET /api/users returns currently authenticated user STATUS 200

router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    await res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
    });
  })
);

// POST /api/users Creates a user, sets location header to "/" and returns no content STATUS 201

router.post(
  "/users",
  [
    check("firstName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "first name"'),
    check("lastName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "last name"'),
    check("emailAddress")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "email"'),
    check("password")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "password"'),
  ],

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    let user = req.body;
    user.password = bcryptjs.hashSync(user.password);
    user = await User.create(req.body);
    res.location("/");
    return res.status(201).end();
  })
);

// ------------------------------------------
//  COURSE ROUTES
// ------------------------------------------

// GET /api/courses Returns a list of courses STATUS 200

router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
    });
    res.json(courses);
  })
);

// GET /api/courses/:id returns the course for provided ID STATUS 200

router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
    });

    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: "Course not found." });
    }
  })
);

// POST /api/courses Creates a course, sets location header to URI for course STATUS 201

router.post(
  "/courses",
  [
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "title"'),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "description"'),
  ],
  authenticateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    const course = await Course.create(req.body);
    res.location(`/courses/${course.id}`);
    return res.status(201).end();
  })
);

// PUT /api/courses/:id Updates a course and returns no content STATUS 204. Status 403 if there is an unauthorized user trying to update

router.put(
  "/courses/:id",
  [
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "title"'),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "description"'),
  ],
  authenticateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    const course = await Course.findByPk(req.params.id);
    if (course.userId === req.currentUser.id) {
      await course.update(req.body);
      res.status(204).end();
    } else {
      res.status(403).end();
    }
  })
);

// DELETE /api/courses/:id Deletes a course and returns no content STATUS 204. Status 403 if there is an unauthorized user trying to delete

router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);

    if (course.userId === req.currentUser.id) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(403).end();
    }
  })
);

module.exports = router;
