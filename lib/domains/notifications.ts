import queryString from "query-string";
import { parse, addDays, endOfDay } from "date-fns";
import { BeyondDeal } from "./burpple";
import { LickilickyVenue } from "./lickilicky";
import { daysBetween } from "../helpers";
import chunk from "lodash/chunk";

type VenueFilter = "RETURNING" | "NEWLY_ADDED" | "CHANGED_DEALS";

const mapVenueToGoogleMapsParams = (venue: LickilickyVenue): string =>
  queryString.stringify({
    api: 1,
    query: venue.name,
  });

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
📍 <a href="https://www.google.com/maps/search/?${mapVenueToGoogleMapsParams(
      venue
    )}">${venue.location.address}</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@Burpple #BeyondUpdates
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

  _makeCombinedNewlyAdded(venues: Array<LickilickyVenue>): Notification | null {
    if (!venues || !venues.length) return null;
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    const caption = `✨ New: ✨ ${groupedLinks}

@Burpple #BeyondUpdates`;
    return {
      caption,
    };
  }

  _makeReturning(venue: LickilickyVenue): Notification {
    const flavorText = `Welcome back: 🎉 <strong>${venue.name}</strong> 🎉`;
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
📍 <a href="https://www.google.com/maps/search/?${mapVenueToGoogleMapsParams(
      venue
    )}">${venue.location.address}</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@Burpple #BeyondUpdates
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

  _makeCombinedReturning(venues: Array<LickilickyVenue>): Notification | null {
    if (!venues || !venues.length) return null;
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    const caption = `🎉 Welcome back: 🎉 ${groupedLinks}

@Burpple #BeyondUpdates`;
    return {
      caption,
    };
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
📍 <a href="https://www.google.com/maps/search/?${mapVenueToGoogleMapsParams(
      venue
    )}">${venue.location.address}</a>
🌍 <a href="https://burpple.com/${venue.url}">View on Burpple</a>

@Burpple #BeyondUpdates
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

  _makeCombinedRemoved(venues: Array<LickilickyVenue>): Notification | null {
    if (!venues || !venues.length) return null;
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    const caption = `Goodbye 👋 ${groupedLinks} Hope to see you soon back on @Burpple #BeyondUpdates`;
    return {
      caption,
    };
  }

  _makeCombinedExpiring(venues: Array<LickilickyVenue>): Notification | null {
    if (!venues || !venues.length) return null;
    const groupedLinks = venues
      .map(
        (venue) =>
          `<a href="https://burpple.com/${venue.url}">${venue.name}</a>`
      )
      .join(`, `);
    return {
      caption: `🏃‍♀️ Hurry down to ${groupedLinks} while you still can! The current deals are expiring soon on @Burpple #BeyondUpdates`,
    };
  }

  newlyAdded(): Array<Notification | null> {
    const venuesAddedSinceLastRun = this.updatedVenues.filter(
      (venue) => venue.newly_added
    );
    if (venuesAddedSinceLastRun.length > 20) {
      throw new Error("Too many new venues! Handle manually");
    } else if (venuesAddedSinceLastRun.length > 4) {
      const batched = chunk(venuesAddedSinceLastRun, 10);
      return batched
        .map((batch) => this._makeCombinedNewlyAdded(batch))
        .filter(Boolean);
    } else {
      return venuesAddedSinceLastRun.map((venue) =>
        this._makeNewlyAdded(venue)
      );
    }
  }

  returning(): Array<Notification | null> {
    const venuesReturningSinceLastRun = this.updatedVenues.filter(
      (venue) => venue.returning
    );
    if (venuesReturningSinceLastRun.length > 20) {
      console.error(
        `Too many venues returning! Handle manually: ${venuesReturningSinceLastRun.length}`
      );
      return [];
    } else if (venuesReturningSinceLastRun.length > 4) {
      const batched = chunk(venuesReturningSinceLastRun, 10);
      return batched
        .map((batch) => this._makeCombinedReturning(batch))
        .filter(Boolean);
    } else {
      return venuesReturningSinceLastRun
        .map((venue) => this._makeReturning(venue))
        .filter(Boolean);
    }
  }

  removed(): Array<Notification | null> {
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
    if (venuesRemovedSinceLastRun.length > 20) {
      console.error(
        `Too many venues removed! Handle manually: ${venuesRemovedSinceLastRun.length}`
      );
      return [];
    } else {
      const batched = chunk(venuesRemovedSinceLastRun, 10);
      return batched
        .map((batch) => this._makeCombinedRemoved(batch))
        .filter(Boolean);
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

    return venuesWithDealsChanged.map(this._makeDealsChanged).filter(Boolean);
  }

  expiring(): Array<Notification | null> {
    const oneWeekFromNowEnd = endOfDay(addDays(new Date(), 7));
    const oneWeekFromNowStart = endOfDay(addDays(new Date(), 6));
    const venuesExpiring = this.updatedVenues.filter((venue) => {
      if (venue.expiryDate) {
        const expires = parse(venue.expiryDate, "d MMM yyyy", new Date());
        return (
          expires &&
          expires >= oneWeekFromNowStart &&
          expires <= oneWeekFromNowEnd
        );
      }
    });
    if (venuesExpiring.length > 20) {
      console.error(
        `Too many venues expiring! Handle manually: ${venuesExpiring.length}`
      );
      return [];
    } else {
      const batched = chunk(venuesExpiring, 10);
      return batched
        .map((batch) => this._makeCombinedExpiring(batch))
        .filter(Boolean);
    }
  }
}

export default Notifications;
