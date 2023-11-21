const router = require('express').Router();

const { signingUp } = require('./mailer.js')
const { sendmail } = require('./mailer.js')

router.post('/user/signup', signingUp);
router.post('/user/sendmail', sendmail);

module.exports = router;
