'use strict';

const got = require('got');
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

const formatList = (list) => { return list.join(`
`) }

const createVenueDiffResponse = (addedList, removedList) => {
  const addedResponse = !addedList.length ? '' : `—————————
<b>Added Recently:</b>
—————————
${formatList(addedList)}
`

  const removedResponse = !removedList.length ? '' : `—————————
<b>Removed Recently:</b>
—————————
${formatList(removedList)}
`

  const textResponse = [addedResponse, removedResponse].filter((text) => {
    return text.length
  }).join(`
`)

  console.log(textResponse)

  return textResponse
}

const sendText = async (textResponse) => {
	try {
    if (textResponse.length) {
      const endpoint = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&parse_mode=html&text=` + encodeURIComponent(`${textResponse}`)
		  const response = await got(endpoint);
		  console.log(response.body);
      return response
    }
	} catch (error) {
		console.log(error);
	}
};

const sayVenueDiffResponse = async (addedList, removedList) => {
  const diff = createVenueDiffResponse(addedList, removedList)
  return await sendText(diff)
}

exports.default = sayVenueDiffResponse
