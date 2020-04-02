import got from "got";
import fs from "fs";
import moment from "moment";
import Burpple, { BeyondDeal } from "./burpple";
import { getNestedObject, contains } from "../helpers";

export type Location = {
  address: string;
  longitude: number;
  latitude: number;
  neighbourhood: string;
};

export type LickilickyVenue = {
  id: number;
  name: string;
  location: Location;
  banner_url: string;
  dishes: Array<any>;
  url: string;
  categories: Array<string>;
  formatted_price: string;
  time_first_added: number;
  deals: Array<BeyondDeal>;
  expiryDate: string;
  previous_deals?: Array<BeyondDeal>;
  newly_added: boolean;
  returning: boolean;
  removed: boolean;
  time_last_removed?: number;
};

class Lickilicky {
  private readonly Burpple: Burpple;

  REDUNDANT_CATEGORIES = [
    "1-for-1 Deals",
    "Good For Groups",
    "Supper",
    "Late Night",
    "Dinner with Drinks",
    "Hidden Gem",
  ];

  ESSENTIAL_CATEGORIES = ["Halal", "Newly Opened"];

  constructor(Burpple: Burpple) {
    this.Burpple = Burpple;
  }

  async getVenues(): Promise<void | Array<LickilickyVenue>> {
    if (!process.env.PARSED_VENUE_URL) {
      throw new Error(`Missing required process.env.PARSED_VENUE_URL`);
    }
    const existingLickilickyVenueResponse = await got(
      process.env.PARSED_VENUE_URL,
      {
        json: true,
      }
    );
  }

  private async _hydrateVenue(
    partialVenue: LickilickyVenue
  ): Promise<LickilickyVenue> {
    const alreadyHydrated = partialVenue.dishes && partialVenue.dishes.length;
    if (alreadyHydrated) return partialVenue;

    const burppleVenue = await this.Burpple.getVenue(partialVenue.id);
    const banner_url = burppleVenue.images[0].medium_url;
    const categories: Array<string> = burppleVenue.categories
      .map((c: any): string => c.name)
      .filter((c2: string) => !c2.includes("Burpple"))
      .filter((c3: string) => !contains(c3, this.REDUNDANT_CATEGORIES));
    const mustIncludeCategories = categories.filter((ctg: string) =>
      contains(ctg, this.ESSENTIAL_CATEGORIES)
    );
    const selectedCategories = [categories[0], ...mustIncludeCategories].filter(
      Boolean
    );
    const deals = burppleVenue.beyond
      ? burppleVenue.beyond.redemptions.map((r: any) => {
          const deal = r.beyond_deal;
          return {
            id: deal.id,
            title: deal.title,
            max_savings: deal.formatted_max_savings,
          };
        })
      : [];
    const dishes = burppleVenue.dishes.map((dish: any) => ({
      name: dish.name,
      formatted_price: dish.formatted_price,
    }));
    const expiryString = getNestedObject(burppleVenue, [
      "beyond",
      "venue_additional_info",
      0,
      "title",
    ]);
    const expiryDate = expiryString
      ? moment(
          expiryString.replace("All deals valid till ", ""),
          "D MMM YYYY",
          true
        ).format("D MMM YYYY")
      : null;

    return Object.assign(partialVenue, {
      url: burppleVenue.url,
      banner_url,
      categories: selectedCategories,
      dishes,
      deals,
      expiryDate,
    });
  }

  async hydrateAllVenues(
    partialVenues: Array<LickilickyVenue>
  ): Promise<Array<LickilickyVenue>> {
    const newVenues: Array<LickilickyVenue> = [];
    const promises = partialVenues.map((v) => async () =>
      this._hydrateVenue(v)
    );
    for (const hydrateVenue of promises) {
      const result = await hydrateVenue();
      newVenues.push(result);
    }
    return newVenues;
  }

  removedVenues(
    updatedVenues: Array<LickilickyVenue>,
    existingVenues: Array<LickilickyVenue>
  ): Array<LickilickyVenue> {
    return existingVenues
      .filter(
        (existing) =>
          !updatedVenues.find((updated) => existing.id === updated.id)
      )
      .map((removedVenue) => ({
        time_last_removed: Date.now(),
        ...removedVenue,
        newly_added: false,
        removed: true,
      }));
  }

  async replaceExistingVenues(
    allVenues: Array<LickilickyVenue>
  ): Promise<void> {
    await fs.writeFile(
      "dist/data/venues.min.json",
      JSON.stringify(allVenues),
      (err) => {
        if (err) throw err;
        console.log("Venues saved!");
      }
    );
  }
}

export default Lickilicky;
