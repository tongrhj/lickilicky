import queryString from "query-string";
import got from "got";
import { Notification } from "./domains/notifications";

// https://core.telegram.org/bots/api
type SendTextOptions = {
  chat_id: number | string;
  parse_mode?: string;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
};

type SendPhotoOptions = {
  caption: string;
  chat_id: number | string;
  parse_mode?: string;
  disable_notification?: boolean;
};

type TelegramResponse = {
  body:
    | {
        ok: true;
        result: any;
        description?: string;
      }
    | {
        ok: false;
        description: string;
      };
};

class Telegram {
  private readonly baseUrl: string;

  constructor(token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async _sendText(
    text: string,
    options: SendTextOptions
  ): Promise<TelegramResponse | void> {
    try {
      if (text.length) {
        const params = queryString.stringify({
          ...options,
          parse_mode: "html",
          text,
        });
        const response: TelegramResponse = await got(
          `${this.baseUrl}/sendMessage?${params}`,
          {
            json: true,
          }
        );
        console.log(response.body);
        return response;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async _sendPhoto(
    photo: string,
    options: SendPhotoOptions
  ): Promise<TelegramResponse | void> {
    try {
      const params = queryString.stringify({
        photo,
        ...options,
      });
      const response: TelegramResponse = await got(
        `${this.baseUrl}/sendPhoto?${params}`,
        {
          json: true,
        }
      );
      console.log(response.body);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async sendNotification(
    notification: Notification,
    chatId: number | string
  ): Promise<void> {
    if (notification.photo) {
      await this._sendPhoto(notification.photo, {
        disable_notification: true,
        parse_mode: "HTML",
        caption: notification.caption,
        chat_id: chatId,
      });
    } else {
      await this._sendText(notification.caption, {
        disable_notification: true,
        disable_web_page_preview: true,
        parse_mode: "HTML",
        chat_id: chatId,
      });
    }
    return;
  }
}

export default Telegram;
