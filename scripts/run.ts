import updateVenues from "./updateVenues";
import notifyTelegram from "./notifyTelegram";

try {
  (async () => {
    const result = await updateVenues();
    const BurppleBeyondFans = process.env.TELEGRAM_CHAT_ID;
    if (!!BurppleBeyondFans) {
      await notifyTelegram({
        ...result,
        chatIds: [BurppleBeyondFans],
        modules: [
          "newlyAdded",
          "returning",
          "removed",
          "dealsChanged",
          "expiring",
        ],
      });
    }
    const OfficialBurppleChannel = process.env.TELEGRAM_CHAT_ID_2;
    if (!!OfficialBurppleChannel) {
      await notifyTelegram({
        ...result,
        chatIds: [OfficialBurppleChannel],
        modules: ["newlyAdded", "returning", "dealsChanged", "expiring"],
      });
    }
    console.log("[ FINISH ]");
  })();
} catch (e) {
  console.error(e);
  process.exit(1);
}
