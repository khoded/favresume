require('dotenv').config()
const mg = require('mailgun-js')({apiKey: process.env.API_KEY, domain: process.env.DOMAIN});

module.exports = mg