"use strict";

const got = require("got");
const queryString = require("query-string");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const daysBetween = (then, now = Date.now()) => {
  const ONE_DAY = 1000 * 60 * 60 * 24; // 86,400,000
  return Math.round((now - then) / ONE_DAY);
};

const sendText = async (text, options = {}) => {
  try {
    if (text.length) {
      const params = queryString.stringify({
        ...options,
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: "html",
        text
      });
      const response = await got(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?${params}`
      );
      console.log(response.body);
      return response;
    }
  } catch (error) {
    console.log(error);
  }
};

const sendPhoto = async (photo, options = {}) => {
  try {
    const params = {
      chat_id: TELEGRAM_CHAT_ID,
      photo,
      ...options
    };
    const response = await got(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto?${queryString.stringify(
        params
      )}`
    );
    console.log(response.body);
    return response;
  } catch (error) {
    console.log(error);
  }
};

// categories: Array<String>
const selectCategories = categories => {
  const bestCategory = categories[0];
  const halalCategory = categories.find(ctg => ctg === "Halal");
  return [bestCategory, halalCategory].filter(Boolean).join(", ");
};

const formatResponse = async (venue, status) => {
  // No nesting of tags, see: https://core.telegram.org/bots/api#html-style
  const deals = venue.deals
    .map(deal => `${deal.title} (${deal.max_savings})`)
    .join(", ");
  const dishes = venue.dishes
    .map(dish => `${dish.name} (${dish.formatted_price})`)
    .join(", ");
  const mapParams = {
    api: 1, // required by Google
    query: venue.name
  };
  const flavorText =
    status === "NEWLY_ADDED"
      ? `✨ New: <strong>${venue.name}</strong> ✨`
      : `Welcome back 🎉 <strong>${venue.name}</strong> 🎉`;
  const caption = `${flavorText}
1-for-1: ${deals}

${
    venue.categories && venue.categories.length
      ? `✅ ${selectCategories(venue.categories)}`
      : ""
  }${dishes && dishes.length ? `\n👍 ${dishes}` : ""}
📍 <a href="https://www.google.com/maps/search/?${queryString.stringify(
    mapParams
  )}">${venue.location.address}</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@burpplebeyond
`;
  if (venue.banner_url && venue.banner_url.length) {
    return await sendPhoto(venue.banner_url, {
      disable_notification: true,
      parse_mode: "HTML",
      caption: caption
    });
  } else {
    return await sendText(caption, {
      disable_notification: true,
      disable_web_page_preview: true,
      parse_mode: "HTML"
    });
  }
};

exports.default = async (addedList, removedList, returningList) => {
  // const diff = createVenueDiffResponse(addedList, removedList)
  const response = await Promise.all(
    addedList.map(async venue => await formatResponse(venue, "NEWLY_ADDED"))
  );

  const returningReponse = await Promise.all(
    returningList.map(async venue => await formatResponse(venue, "RETURNING"))
  );

  const removedResponse = await Promise.all(
    removedList.map(async venue => {
      return await sendText(
        `Farewell 👋 <a href="https://burpple.com/${venue.url}">${
          venue.name
        }</a>

Tracked by @burpplebeyond for ${daysBetween(
          venue.time_first_added,
          Date.now()
        )} days
`,
        {
          disable_notification: true,
          disable_web_page_preview: true,
          parse_mode: "HTML"
        }
      );
    })
  );

  return response;
};
