import got from "got";

import { contains } from "../lib/helpers";
import { LickilickyVenue } from "../lib/domains/lickilicky";
import Notifications from "../lib/domains/notifications";
import Telegram from "../lib/telegram";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

type NotifyTelegramParams = {
  updatedVenues: Array<LickilickyVenue>;
  removedVenues: Array<LickilickyVenue>;
  chatIds: Array<string>;
};

const notifyTelegram = async ({
  updatedVenues,
  removedVenues,
  chatIds,
}: NotifyTelegramParams): Promise<void> => {
  const notify = new Notifications({
    updatedVenues,
    removedVenues,
  });
  const notificationsToSend = [
    ...notify.newlyAdded(),
    ...notify.returning(),
    ...notify.removed(),
    ...notify.dealsChanged(),
    ...notify.expiring(),
  ];
  if (notificationsToSend.length > 0) {
    if (!TELEGRAM_TOKEN) {
      throw new Error(`Missing Telegram Token`);
    }
    const NotificationService = new Telegram(TELEGRAM_TOKEN);
    let combinedPromises: Array<Function> = [];
    for (const chatId of chatIds) {
      combinedPromises.concat(
        notificationsToSend.map((n) => async () => {
          await NotificationService.sendNotification(n, chatId);
        })
      );
    }
    for (const promise of combinedPromises) {
      await promise();
    }
  }
};

export default notifyTelegram;
