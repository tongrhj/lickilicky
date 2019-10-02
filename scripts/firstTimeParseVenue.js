"use strict";

const fs = require("fs");
const got = require("got");
const notifyTelegram = require("./notifyTelegram").default;
const moment = require("moment");
const { CookieJar } = require('tough-cookie');

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;

const getNestedObject = (nestedObj, pathArr) => {
  return pathArr.reduce(
    (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined),
    nestedObj
  );
};

Array.prototype.contains = function(obj) {
  return this.indexOf(obj) > -1;
};

(async () => {
  try {
    const latestDataResponse = await got(
      `https://app.burpple.com/p1/beyond/venues?auth_token=${
        process.env.BURPPLE_AUTH_TOKEN
      }`,
      {
        json: true,
        headers: {
          "user-agent":
            "Burpple Beyond Fans https://t.me/burpplebeyond"
        }
      }
    );
    const latestData = latestDataResponse.body;

    const existingDataResponse = await got(process.env.PARSED_VENUE_URL, {
      json: true
    });
    const existingData = existingDataResponse.body;

    const cookieJar = new CookieJar();

    const newData = latestData.data.map(function(d) {
      // Returns first matching Venue Object or undefined
      const existingVenue = existingData.find(function(venue) {
        return venue.id == d.id;
      });

      const newD = {
        id: d.id,
        name: d.name,
        formatted_price: d.formatted_price,
        newly_added: !existingVenue,
        returning: existingVenue && existingVenue.removed,
        time_first_added: existingVenue
          ? existingVenue.time_first_added
          : Date.now(),
        removed: false,
        dishes: d.dishes,
        url: d.url,
        location: {
          address: [d.location.address_2, d.location.street, d.location.zipcode]
            .filter(Boolean)
            .join(", "),
          longitude: d.location.longitude,
          latitude: d.location.latitude,
          neighbourhood: d.location.neighbourhood
        },
        banner_url: d.banner_url,
        categories: d.categories,
        deals: d.deals,
        expiryDate: d.expiryDate
      };
      return newD;
    });

    let newDataDeals = []

    const newDataDealsPromises = newData.map(d => async () => {
      if (d.dishes && d.dishes.length) {
        newDataDeals.push(d);
      }

      const response = await got(
        `https://app.burpple.com/p1/venues/${d.id}?auth_token=${
          process.env.BURPPLE_AUTH_TOKEN
        }`,
        {
          json: true,
          headers: {
            "user-agent":
              "Burpple Beyond Fans https://t.me/burpplebeyond"
          },
          cookieJar
        }
      );
      const data = response.body.data;

      const banner_url = data.images[0].medium_url;
      const categories = data.categories
        .map(c => c.name)
        .filter(c2 => !c2.includes("Burpple"));

      const deals = data.beyond
        ? data.beyond.redemptions.map(r => {
            const deal = r.beyond_deal;
            return {
              id: deal.id,
              title: deal.title,
              max_savings: deal.formatted_max_savings
            };
          })
        : [];

      const dishes = data.dishes.map(dish => {
        return {
          name: dish.name,
          formatted_price: dish.formatted_price
        };
      });

      const expiryString = getNestedObject(data, [
        "beyond",
        "venue_additional_info",
        0,
        "title"
      ]);

      const expiryDate = expiryString
        ? moment(
            expiryString.replace("All deals valid till ", ""),
            "D MMM YYYY",
            true
          ).format("D MMM YYYY")
        : null;

      newDataDeals.push(Object.assign(d, {
        url: data.url,
        banner_url,
        categories,
        dishes,
        deals,
        expiryDate
      }));
    })

    for (const p of newDataDealsPromises) {
      await p();
    }

    const removedData = existingData
      .filter(function(venue) {
        return !newDataDeals.find(function(d) {
          return venue.id == d.id;
        });
      })
      .map(d => {
        return {
          time_last_removed: Date.now(),
          ...d,
          newly_added: false,
          removed: true
        };
      });
    const minData = JSON.stringify(newDataDeals.concat(removedData));
    fs.writeFile("dist/data/venues.min.json", minData, err => {
      if (err) throw err;
      console.log("venues saved!");
    });

    // Send Notifications
    // options:
    // includePreviousDeals: boolean - to see deals changed from what to what
    const formatData = (data, options = {}) =>
      data.map(d => {
        const existingVenue = existingData.find(function(venue) {
          return venue.id == d.id;
        });
        const defaultInfo = {
          id: d.id,
          name: d.name,
          location: d.location,
          banner_url: d.banner_url,
          dishes: d.dishes,
          url: d.url,
          categories: d.categories,
          formatted_price: d.formatted_price,
          time_first_added: d.time_first_added,
          deals: d.deals
            ? [...new Set(d.deals.map(item => item.title))].map(title =>
                d.deals.find(el => el.title === title)
              )
            : [], // Deals with unique titles only
          expiryDate: d.expiryDate
        };

        if (options.includePreviousDeals) {
          defaultInfo.previous_deals = existingVenue.deals
            ? [...new Set(existingVenue.deals.map(item => item.title))].map(
                title => existingVenue.deals.find(el => el.title === title)
              )
            : [];
        }

        return defaultInfo;
      });

    const venuesAddedSinceLastRun = newDataDeals.filter(d => d.newly_added);
    const venuesReturningSinceLastRun = newDataDeals.filter(d => d.returning);
    const venuesRemovedSinceLastRun = removedData.filter(
      d => d.time_last_removed > Date.now() - 600000
    );

    const venuesWithDealsChanged = newDataDeals.filter(d => {
      if (d.newly_added || d.returning) {
        return false;
      }

      const newDealIds = d.deals.map(deal => deal.id);
      const existingVenue = existingData.find(venue => venue.id === d.id);
      const existingVenueDealIds = existingVenue.deals.map(deal => deal.id);

      return !newDealIds.every(dealId => existingVenueDealIds.contains(dealId));
    });

    const oneWeekFromNowEnd = moment()
      .add(1, "weeks")
      .endOf("day");
    const oneWeekFromNowStart = moment()
      .add(6, "days")
      .endOf("day");
    const venuesExpiring = newDataDeals.filter(d => {
      if (d.expiryDate) {
        const expires = moment(d.expiryDate, "D MMM YYYY", true);
        return (
          expires &&
          expires >= oneWeekFromNowStart &&
          expires <= oneWeekFromNowEnd
        );
      }
    });

    await notifyTelegram(
      formatData(venuesAddedSinceLastRun),
      formatData(venuesRemovedSinceLastRun),
      formatData(venuesReturningSinceLastRun),
      formatData(venuesExpiring),
      formatData(venuesWithDealsChanged, { includePreviousDeals: true }),
      { chat_ids: [] }
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
