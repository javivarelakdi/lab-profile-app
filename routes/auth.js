// routes/auth-routes.js

const express    = require('express');
const authRoutes = express.Router();
const bcrypt     = require('bcrypt');
const User       = require('../models/user-model');
const { checkUsernameAndPasswordNotEmpty, checkUsernameNotEmpty } = require('../middlewares');
const bcryptSalt = 10;


authRoutes.post('/login', checkUsernameAndPasswordNotEmpty, async (req, res, next) => {
	const { username, password } = res.locals.auth;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ code: 'not-found' });
		}
		if (bcrypt.compareSync(password, user.password)) {
			req.session.currentUser = user;
			return res.json(user);
		}
		return res.status(404).json({ code: 'not-found' });
	} catch (error) {
		next(error);
	}
});

authRoutes.post('/signup', checkUsernameAndPasswordNotEmpty, async (req, res, next) => {
	const { username, password, campus, course, file } = res.locals.auth;
	try {
		const user = await User.findOne({ username });
		if (user) {
			return res.status(422).json({ code: 'username-not-unique' });
		}

		const salt = bcrypt.genSaltSync(bcryptSalt);
		const hashedPassword = bcrypt.hashSync(password, salt);

		const newUser = await User.create({ username, password: hashedPassword, course, campus, file });
		req.session.currentUser = newUser;
		return res.json(newUser);
	} catch (error) {
		next(error);
	}
});

authRoutes.post('/edit', checkUsernameNotEmpty, async (req, res, next) => {
  const { file, username, campus, course } = res.locals.auth;
	try {
    const userUpdate = await User.update({ username : username }, { $set: { file, campus, course }})
    return res.json(userUpdate);
	} catch (error) {
		next(error);
	}
});

authRoutes.post('/logout', (req, res, next) => {
	req.session.destroy(err => {
		if (err) {
			next(err);
		}
		return res.status(204).send();
	});
});

authRoutes.get('/loggedin', (req, res, next) => {
	if (req.session.currentUser) {
		res.status(200).json(req.session.currentUser);
	} else {
		res.status(401).json({ code: 'unauthorized' });
	}
});


module.exports = authRoutes;