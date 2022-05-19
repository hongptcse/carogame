const moment = require('moment');

function FormatMessage(username, msg) {
  return { username, msg, time: moment().format('h:mm a')};
}

module.exports = FormatMessage;
