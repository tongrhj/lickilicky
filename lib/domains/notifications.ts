import queryString from "query-string";
import moment from "moment";
import { BeyondDeal } from "./burpple";
import { LickilickyVenue } from "./lickilicky";
import { daysBetween } from "../helpers";

type VenueFilter = "RETURNING" | "NEWLY_ADDED" | "CHANGED_DEALS";

export type Notification = {
  caption: string;
  photo?: string;
};

type LickilickyVenueWithPreviousDeals = LickilickyVenue & {
  previous_deals: Array<BeyondDeal>;
};

class Notifications {
  updatedVenues: Array<LickilickyVenue>;
  removedVenues: Array<LickilickyVenue>;

  constructor({
    updatedVenues,
    removedVenues,
  }: {
    updatedVenues: Array<LickilickyVenue>;
    removedVenues: Array<LickilickyVenue>;
  }) {
    this.updatedVenues = updatedVenues;
    this.removedVenues = removedVenues;
  }

  _mapParams(venue: LickilickyVenue): string {
    return queryString.stringify({
      api: 1,
      query: venue.name,
    });
  }

  // Not allowed to nest HTML tags within caption
  // See: https://core.telegram.org/bots/api#html-style
  _makeNewlyAdded(venue: LickilickyVenue): Notification {
    const flavorText = `✨ New: <strong>${venue.name}</strong> ✨`;
    const deals =
      (venue.deals &&
        venue.deals
          .map((deal) => `${deal.title} (${deal.max_savings})`)
          .join(", ")) ||
      "";
    const dishes =
      (venue.dishes &&
        venue.dishes
          .map((dish) => `${dish.name} (${dish.formatted_price})`)
          .join(", ")) ||
      "";
    const caption = `${flavorText}
1-for-1: ${deals}

${
  venue.categories && venue.categories.length
    ? `✅ ${venue.categories.join(", ")}`
    : ""
}${dishes && dishes.length ? `\n👍 ${dishes}` : ""}
📍 <a href="https://www.google.com/maps/search/?${this._mapParams(venue)}">${
      venue.location.address
    }</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@burpplebeyond
`;
    if (venue.banner_url && venue.banner_url.length) {
      return {
        caption,
        photo: venue.banner_url,
      };
    } else {
      return {
        caption,
      };
    }
  }

  _makeReturning(venue: LickilickyVenue): Notification {
    const flavorText = `Open for takeaway: 🎉 <strong>${venue.name}</strong> 🎉`;
    const deals =
      (venue.deals &&
        venue.deals
          .map((deal) => `${deal.title} (${deal.max_savings})`)
          .join(", ")) ||
      "";
    const dishes =
      (venue.dishes &&
        venue.dishes
          .map((dish) => `${dish.name} (${dish.formatted_price})`)
          .join(", ")) ||
      "";
    const caption = `${flavorText}
  1-for-1: ${deals}

  ${
    venue.categories && venue.categories.length
      ? `✅ ${venue.categories.join(", ")}`
      : ""
  }${dishes && dishes.length ? `\n👍 ${dishes}` : ""}
  📍 <a href="https://www.google.com/maps/search/?${this._mapParams(venue)}">${
      venue.location.address
    }</a>
  🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

  @burpplebeyond
  `;
    if (venue.banner_url && venue.banner_url.length) {
      return {
        caption,
        photo: venue.banner_url,
      };
    } else {
      return {
        caption,
      };
    }
  }

  _makeDealsChanged(
    venue: LickilickyVenue & { previous_deals: Array<BeyondDeal> }
  ): Notification {
    const flavorText = `Fresh new deals at 💚 <strong>${venue.name}</strong> 💚`;
    const newlyAddedDeals =
      venue.deals
        .filter((current) =>
          venue.previous_deals.every((prev) => prev.id !== current.id)
        )
        .map((deal) => `${deal.title} (${deal.max_savings})`)
        .join(", ") || "";
    const removedDeals =
      venue.previous_deals
        .filter((prev) =>
          venue.deals.every((current) => current.id !== prev.id)
        )
        .map((deal) => `${deal.title} (${deal.max_savings})`)
        .join(", ") || "";

    const caption = `${flavorText}
➕in: ${newlyAddedDeals}
➖out: ${removedDeals}

${
  venue.categories && venue.categories.length
    ? `✅ ${venue.categories.join(", ")}`
    : ""
}
📍 <a href="https://www.google.com/maps/search/?${this._mapParams(venue)}">${
      venue.location.address
    }</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@burpplebeyond
`;
    if (venue.banner_url && venue.banner_url.length) {
      return {
        caption,
        photo: venue.banner_url,
      };
    } else {
      return {
        caption,
      };
    }
  }

  _makeIndividualRemoved(venue: LickilickyVenue): Notification {
    const lagInDays = daysBetween(venue.time_first_added, Date.now());
    return {
      caption: `Farewell 👋 <a href="https://burpple.com/${venue.url}">${venue.name}</a> has been removed from @burpplebeyond after ${lagInDays} days`,
    };
  }

  _makeCombinedRemoved(venues: Array<LickilickyVenue>): Notification {
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    const caption = `Farewell 👋 ${groupedLinks} have been removed from @burpplebeyond!`;
    return {
      caption,
    };
  }

  _makeIndividualExpiring(venue: LickilickyVenue): Notification {
    return {
      caption: `🏃‍♀️ Hurry down to <a href="https://burpple.com/${venue.url}">${venue.name}</a> while you still can! The current deals are valid till ${venue.expiryDate} on @burpplebeyond`,
    };
  }

  _makeCombinedExpiring(venues: Array<LickilickyVenue>): Notification {
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    return {
      caption: `🏃‍♀️ Hurry down to ${groupedLinks} while you still can! The current deals are expiring soon on @burpplebeyond`,
    };
  }

  newlyAdded(): Array<Notification> {
    const venuesAddedSinceLastRun = this.updatedVenues.filter(
      (venue) => venue.newly_added
    );
    return venuesAddedSinceLastRun.map(this._makeNewlyAdded);
  }

  returning(): Array<Notification> {
    const venuesReturningSinceLastRun = this.updatedVenues.filter(
      (venue) => venue.returning
    );
    return venuesReturningSinceLastRun.map(this._makeReturning);
  }

  removed(): Array<Notification> {
    const venuesRemovedSinceLastRun = this.removedVenues.filter(
      (venue: LickilickyVenue) => {
        // Removed venues have to been added more than 3 days ago
        // Filters out venues that are testing on Beyond
        const lagInDays = daysBetween(venue.time_first_added, Date.now());
        return (
          venue.time_last_removed &&
          venue.time_last_removed > Date.now() - 600000 &&
          lagInDays > 3
        );
      }
    );
    if (venuesRemovedSinceLastRun.length > 3) {
      return [this._makeCombinedRemoved(venuesRemovedSinceLastRun)];
    } else {
      return venuesRemovedSinceLastRun.map(this._makeIndividualRemoved);
    }
  }

  dealsChanged(): Array<Notification> {
    const venuesWithDealsChanged = this.updatedVenues
      .filter((venue: LickilickyVenue) => {
        if (venue.newly_added || venue.returning) return false;

        const newDealIds = venue.deals.map((deal) => deal.id);
        const existingVenue = this.updatedVenues.find(
          (existing) => existing.id === venue.id
        );
        if (!existingVenue) return false;
        const existingVenueDealIds = existingVenue.deals.map((deal) => deal.id);

        return !newDealIds.every((dealId) =>
          existingVenueDealIds.includes(dealId)
        );
      })
      .map((venue) => {
        const existingVenue = this.updatedVenues.find(
          (existing) => existing.id === venue.id
        );

        return {
          ...venue,
          previous_deals:
            existingVenue && existingVenue.deals
              ? [
                  ...existingVenue.deals.map((item) => item.title),
                ].map((title) =>
                  existingVenue.deals.find((deal) => deal.title === title)
                )
              : [],
        };
      });

    return venuesWithDealsChanged.map(this._makeDealsChanged);
  }

  expiring(): Array<Notification> {
    const oneWeekFromNowEnd = moment().add(1, "weeks").endOf("day");
    const oneWeekFromNowStart = moment().add(6, "days").endOf("day");
    const venuesExpiring = this.updatedVenues.filter((venue) => {
      if (venue.expiryDate) {
        const expires = moment(venue.expiryDate, "D MMM YYYY", true);
        return (
          expires &&
          expires >= oneWeekFromNowStart &&
          expires <= oneWeekFromNowEnd
        );
      }
    });
    if (venuesExpiring.length > 3) {
      return [this._makeCombinedExpiring(venuesExpiring)];
    } else {
      return venuesExpiring.map(this._makeIndividualExpiring);
    }
  }
}

export default Notifications;
