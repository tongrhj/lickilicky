'use strict';

const fs = require('fs');
const replace = require('replace-in-file');

const options = {
  files: './dist/index.html',
  from: /<span id="last-updated-date">.*<\/span>/,
  to: '<span id="last-updated-date">23 July 2018</span>',
};

replace(options, (error, changes) => {
  if (error) {
    return console.error('Error occurred:', error);
  }
  console.log('Modified files:', changes.join(', '));
});
