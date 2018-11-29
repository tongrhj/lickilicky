'use strict';

const got = require('got');
const queryString = require('query-string');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

const sendText = async (text, options = {}) => {
	try {
    if (text.length) {
      const params = queryString.stringify({
        ...options,
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: "html",
        text
      })
		  const response = await got(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?${params}`)
		  console.log(response.body);
      return response
    }
	} catch (error) {
		console.log(error);
	}
};

const sendPhoto = async (photo, options = {}) => {
	try {
    if (photo.length) {
      const params = {
        chat_id: TELEGRAM_CHAT_ID,
        photo,
        ...options
      }
      console.log(params)
		  const response = await got(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto?${queryString.stringify(params)}`)
		  console.log(response.body);
      return response
    }
	} catch (error) {
		console.log(error);
	}
};

// categories: Array<String>
const selectCategories = (categories) => {
  const bestCategory = categories[0]
  const halalCategory = categories.find(ctg => ctg === 'Halal')
  return [bestCategory, halalCategory].filter(Boolean).join(', ')
}

exports.default = async (addedList, removedList) => {
  // const diff = createVenueDiffResponse(addedList, removedList)
  const response = await Promise.all(addedList.map(async (venue) => {
    // No nesting of tags, see: https://core.telegram.org/bots/api#html-style
    const deals = venue.deals.map(deal => `${deal.title} (${deal.max_savings})`).join(', ')
    const dishes = venue.dishes.map(dish => `${dish.name} (${dish.formatted_price})`).join(', ')
    const mapParams = {
      api: 1, // required by Google
      query: venue.name
    }
    const caption = `✨ New: <strong>${venue.name}</strong> ✨
1-for-1: ${deals}

✅ ${selectCategories(venue.categories)}${dishes && dishes.length && `\n👍 ${dishes}`}
📍 <a href="https://www.google.com/maps/search/?${queryString.stringify(mapParams)}">${venue.location.address}</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@burpplebeyond
`
    return await sendPhoto(
      venue.banner_url,
      {
        disable_notification: true,
        parse_mode: 'HTML',
        caption: caption
      }
    )
  }))

  const removedResponse = await Promise.all(removedList.map(async (venue) => {
    return await sendText(`Removed: <a href="https://burpple.com/${venue.url}">${venue.name}</a>`, {
      disable_notification: true,
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    })
  }))

  return response
}
