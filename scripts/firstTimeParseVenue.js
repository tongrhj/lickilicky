'use strict';

const fs = require('fs');
const got = require('got');
const notifyTelegram = require('./notifyTelegram').default;

(async () => {

const latestDataResponse = await got(process.env.VENUE_URL, { json: true, headers: { 'user-agent': null } })
const latestData = latestDataResponse.body
// {meta: {"code":200}, data: [{"id":164979,"name":"5 Little Monkeys Cafe","formatted_price":"~$15/pax","beyond_partner":true,"beyond_newly_added":true,"open_now":true,"location":{"city":"Singapore","country":"Singapore","state":"","street":"20 Kallang Avenue","address_2":"#11-00 Pico Creative Centre","zipcode":"339411","latitude":1.3098178,"longitude":103.8650975,"neighbourhood":"Kallang"},"avatar":{"url":"https://s3.burpple.com/venues/cafe_logo_-cropped-_copy-png_164979_original?1537238727","medium_url":"https://s3.burpple.com/venues/cafe_logo_-cropped-_copy-png_164979_medium?1537238727","small_url":"https://s3.burpple.com/venues/cafe_logo_-cropped-_copy-png_164979_small?1537238727"}}}

const existingDataResponse = await got(process.env.PARSED_VENUE_URL, { json: true })
const existingData = existingDataResponse.body
// [{"id":164979,"name":"5 Little Monkeys Cafe","formatted_price":"~$15/pax","newly_added":true,"time_first_added":1537864234970,"removed":false,"location":{"longitude":103.8650975,"latitude":1.3098178,"neighbourhood":"Kallang"}}]

const newData = latestData.data.map(function(d){
  // Returns first matching Venue Object or undefined
  const existingVenue = existingData.find(function(venue){return venue.id == d.id})

  const newD = {
    id: d.id,
    name: d.name,
    formatted_price: d.formatted_price,
    newly_added: !existingVenue,
    returning: existingVenue && existingVenue.removed,
    time_first_added: existingVenue ? existingVenue.time_first_added : Date.now(),
    removed: false,
    dishes: d.dishes,
    url: d.url,
    location: {
      address: [d.location.address_2, d.location.street, d.location.zipcode].filter(Boolean).join(', '),
      longitude: d.location.longitude,
      latitude: d.location.latitude,
      neighbourhood: d.location.neighbourhood
    },
    banner_url: d.banner_url,
    categories: d.categories,
    deals: d.deals
  };
  return newD;
});

const newDataDeals = await Promise.all(newData.map(async (d) => {
  if (d.dishes && d.dishes.length) {
    return d
  }

  const response = await got(`https://app.burpple.com/p1/venues/${d.id}?auth_token=${process.env.BURPPLE_AUTH_TOKEN}`, { json: true, headers: { 'user-agent': null } })
  const data = response.body.data

  const banner_url = data.images[0].medium_url
  const categories = data.categories.map(c => c.name).filter(c2 => !c2.includes('Burpple'))

  const deals = data.beyond ? data.beyond.redemptions.map((r) => {
    const deal = r.beyond_deal
    return {
      id: deal.id,
      title: deal.title,
      max_savings: deal.formatted_max_savings
    }
  }) : []

  const dishes = data.dishes.map((dish) => {
    return {
      name: dish.name,
      formatted_price: dish.formatted_price
    }
  })

  return Object.assign(d, {
    url: data.url,
    banner_url,
    categories,
    dishes,
    deals
  })
}))

const removedData = existingData.filter(function(venue){
  return !newDataDeals.find(function(d){return venue.id == d.id})
}).map((d) => {
  return {
    time_last_removed: Date.now(),
    ...d,
    newly_added: false,
    removed: true
  }
});
const minData = JSON.stringify(newDataDeals.concat(removedData))
fs.writeFile('dist/data/venues.min.json', minData, (err) => {
  if (err) throw err;
  console.log('venues saved!');
});

// Send Notifications
const formatData = (data) => data.map(d => {
  return {
    id: d.id,
    name: d.name,
    location: d.location,
    banner_url: d.banner_url,
    dishes: d.dishes,
    url: d.url,
    categories: d.categories,
    formatted_price: d.formatted_price,
    time_first_added: d.time_first_added,
    deals: d.deals ? [...new Set(d.deals.map(item => item.title))].map(title => d.deals.find(el => el.title === title)) : [] // Deals with unique titles only
  }
})
const venuesAddedSinceLastRun = newDataDeals.filter(d => d.newly_added)
const venuesReturningSinceLastRun = newDataDeals.filter(d => d.returning)
const venuesRemovedSinceLastRun = removedData.filter(d => d.time_last_removed > Date.now() - 600000)
await notifyTelegram(formatData(venuesAddedSinceLastRun), formatData(venuesRemovedSinceLastRun), formatData(venuesReturningSinceLastRun))
})().catch(err => {
  console.error(err.message);
  throw err
});

process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Rejection at: ${reason}`);
  throw new Error(reason)
});
