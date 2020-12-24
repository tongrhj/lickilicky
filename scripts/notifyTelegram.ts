import { LickilickyVenue } from "../lib/domains/lickilicky";
import Notifications from "../lib/domains/notifications";
import Telegram from "../lib/telegram";
import flatten from "lodash/flatten";

import type { Notification } from "../lib/domains/notifications";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

export type Modules =
  | "newlyAdded"
  | "returning"
  | "removed"
  | "dealsChanged"
  | "expiring";

type NotifyTelegramParams = {
  updatedVenues: Array<LickilickyVenue>;
  removedVenues: Array<LickilickyVenue>;
  chatIds: Array<string>;
  modules: Array<Modules>;
};

const notifyTelegram = async ({
  updatedVenues,
  removedVenues,
  chatIds,
  modules,
}: NotifyTelegramParams): Promise<void> => {
  const notify = new Notifications({
    updatedVenues,
    removedVenues,
  });
  let notificationsToSend: Array<Notification | null> = flatten(
    modules.map((m) => notify[m]())
  );
  if (notificationsToSend.length > 0) {
    console.log("Sending notifications to Telegram.......");
    if (!TELEGRAM_TOKEN) {
      throw new Error(`Missing Telegram Token`);
    }
    const NotificationService = new Telegram(TELEGRAM_TOKEN);
    let combinedPromises: Array<Function> = [];
    for (const chatId of chatIds) {
      combinedPromises = combinedPromises.concat(
        notificationsToSend.map((n) => async () => {
          if (!n) return;
          await NotificationService.sendNotification(n, chatId);
        })
      );
    }
    for (const promise of combinedPromises) {
      await promise();
    }
    console.log("[ Sent ]");
  } else {
    console.log("[ No notifications ]");
  }
};

export default notifyTelegram;
