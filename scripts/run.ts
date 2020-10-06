import updateVenues from "./updateVenues";
import notifyTelegram from "./notifyTelegram";

try {
  (async () => {
    const result = await updateVenues();
    let chatIds: Array<string> = [];
    const BurppleBeyondFans = process.env.TELEGRAM_CHAT_ID;
    if (!!BurppleBeyondFans) chatIds.push(BurppleBeyondFans);
    const OfficialBurppleChannel = process.env.TELEGRAM_CHAT_ID_2;
    if (!!OfficialBurppleChannel) chatIds.push(OfficialBurppleChannel);
    await notifyTelegram({
      ...result,
      chatIds,
    });
    console.log("[ FINISH ]");
  })();
} catch (e) {
  console.error(e);
  process.exit(1);
}
