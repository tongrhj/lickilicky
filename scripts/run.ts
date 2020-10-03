import updateVenues from "./updateVenues";
import notifyTelegram from "./notifyTelegram";

try {
  (async () => {
    const result = await updateVenues();
    let chatIds: Array<string> = [];
    const BurppleBeyondFans = process.env.TELEGRAM_CHAT_ID;
    if (!!BurppleBeyondFans) chatIds.push(BurppleBeyondFans);
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
