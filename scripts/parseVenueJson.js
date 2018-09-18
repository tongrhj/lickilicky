'use strict';

const fs = require('fs');
const got = require('got');

(async () => {

const latestDataResponse = await got(process.env.VENUE_URL, { json: true, headers: { 'user-agent': null } })
const latestData = latestDataResponse.body

const existingDataResponse = await got(process.env.PARSED_VENUE_URL, { json: true })
const existingData = existingDataResponse.body

const withinPastWeek = function(ms) {
  return ms >= Date.now() - 604800000
}

const newData = latestData.data.map(function(d){
  // Returns first matching Venue Object or undefined
  const existingVenue = existingData.find(function(venue){return venue.id == d.id})

  const newD = {
    id: d.id,
    name: d.name,
    formatted_price: d.formatted_price,
    newly_added: existingVenue ? withinPastWeek(existingVenue.time_first_added) : true,
    time_first_added: existingVenue ? existingVenue.time_first_added : Date.now(),
    removed: false,
    location: {
      longitude: d.location.longitude,
      latitude: d.location.latitude,
      neighbourhood: d.location.neighbourhood
    }
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
    time_first_added: d.time_first_added,
    removed: true,
    time_last_removed: d.time_last_removed || Date.now(),
    location: {
      longitude: d.location.longitude,
      latitude: d.location.latitude,
      neighbourhood: d.location.neighbourhood
    }
  }
  return removedD;
});
const minData = JSON.stringify(newData.concat(removedData))
fs.writeFile('dist/data/venues.min.json', minData, (err) => {
  if (err) throw err;
  console.log('venues saved!');
});

})();
