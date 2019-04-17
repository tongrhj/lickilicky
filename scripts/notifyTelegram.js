"use strict";

const got = require("got");
const queryString = require("query-string");

// Array.new().flat polyfill
Object.defineProperty(Array.prototype, "flat", {
  value: function(depth = 1) {
    return this.reduce(function(flat, toFlatten) {
      return flat.concat(
        Array.isArray(toFlatten) && depth > 1
          ? toFlatten.flat(depth - 1)
          : toFlatten
      );
    }, []);
  }
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const daysBetween = (then, now = Date.now()) => {
  const ONE_DAY = 1000 * 60 * 60 * 24; // 86,400,000
  return Math.round((now - then) / ONE_DAY);
};

const sendText = async (text, options = {}) => {
  try {
    if (text.length) {
      const params = queryString.stringify({
        ...options,
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

Array.prototype.contains = function(obj) {
  return this.indexOf(obj) > -1;
};

const redundant = [
  "1-for-1 Deals",
  "Good For Groups",
  "Supper",
  "Late Night",
  "Dinner with Drinks",
  "Hidden Gem"
];
const mustInclude = ["Halal", "Newly Opened"];

// categories: Array<String>
const selectCategories = categories => {
  const contenders = categories.filter(ctg => !redundant.contains(ctg));
  const mustIncludeCategories = categories.filter(ctg =>
    mustInclude.contains(ctg)
  );
  const allCategories = [contenders[0], ...mustIncludeCategories].filter(
    Boolean
  );
  return allCategories.join(", ");
};

const formatAndSendResponse = async (venue, status, options = {}) => {
  const chat_id = options.chat_id;
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
      caption,
      chat_id
    });
  } else {
    return await sendText(caption, {
      disable_notification: true,
      disable_web_page_preview: true,
      parse_mode: "HTML",
      chat_id
    });
  }
};

exports.default = async (
  addedList,
  removedList,
  returningList,
  expiringList,
  options = {}
) => {
  const response = await Promise.all(
    options.chat_ids
      .map(chat_id => {
        addedList.map(
          async venue =>
            await formatAndSendResponse(venue, "NEWLY_ADDED", { chat_id })
        );
      })
      .flat(1)
  );

  const returningReponse = await Promise.all(
    options["chat_ids"]
      .map(chat_id => {
        returningList.map(
          async venue =>
            await formatAndSendResponse(venue, "RETURNING", { chat_id })
        );
      })
      .flat(1)
  );

  const removedResponse = await Promise.all(
    options["chat_ids"]
      .map(chat_id => {
        removedList.map(async venue => {
          const lagInDays = daysBetween(venue.time_first_added, Date.now());
          return await sendText(
            `Farewell 👋 <a href="https://burpple.com/${venue.url}">${
              venue.name
            }</a> has been removed from @burpplebeyond after ${lagInDays} ${
              lagInDays > 1 ? "days" : "days"
            }`,
            {
              disable_notification: true,
              disable_web_page_preview: true,
              parse_mode: "HTML",
              chat_id
            }
          );
        });
      })
      .flat(1)
  );

  const expiringResponse = await Promise.all(
    options["chat_ids"]
      .map(chat_id => {
        expiringList.map(async venue => {
          return await sendText(
            `🏃‍♀️ Hurry down to <a href="https://burpple.com/${venue.url}">${
              venue.name
            }</a> while you still can! The current deals are valid till ${
              venue.expiryDate
            } on @burpplebeyond`,
            {
              disable_notification: true,
              disable_web_page_preview: true,
              parse_mode: "HTML",
              chat_id
            }
          );
        });
      })
      .flat(1)
  );

  return response;
};
