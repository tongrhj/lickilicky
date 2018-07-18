'use strict';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('historical_data/venues_18July2018.json'));
const existingData = JSON.parse(fs.readFileSync('historical_data/venues_16July2018.min.json'));
const newData = data.data.map(function(d){
  const newD = {
    id: d.id,
    name: d.name,
    formatted_price: d.formatted_price,
    newly_added: !existingData.find(function(venue){return venue.id == d.id}),
    removed: false,
  };
  return newD;
});
const removedData = existingData.filter(function(venue){
  return !newData.find(function(d){return venue.id == d.id})
}).map(function(d){
  const removedD = {
    id: d.id,
    name: d.name,
    formatted_price: d.formatted_price,
    newly_added: false,
    removed: true,
  }
  return removedD;
});
const minData = newData.concat(removedData)
fs.writeFileSync('data/venues.min.json', JSON.stringify(minData));
