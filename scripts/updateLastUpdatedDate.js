'use strict';

const fs = require('fs');
const replace = require('replace-in-file');

const options = {
  files: './dist/index.html',
  from: /<span id="last-updated-date">.*<\/span>/,
  to: `<span id="last-updated-date">${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>`, // 'Sep 19, 2018' Node intl contains en-US only by default
};

replace(options, (error, changes) => {
  if (error) {
    return console.error('Error occurred:', error);
  }
  if (changes.length) {
    console.log('updateLastUpdateDate:', changes.join(', '));
  } else {
    console.log('updateLastUpdateDate: no update necessary')
  }
});
