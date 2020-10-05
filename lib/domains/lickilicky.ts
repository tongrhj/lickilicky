import got from "got";
import fs from "fs";
import { format, parse } from "date-fns";
import Burpple from "./burpple";
import get from "lodash/get";
import chunk from "lodash/chunk";
import { sleep } from "../helpers";

export type Location = {
  address: string;
  longitude: number;
  latitude: number;
  neighbourhood: string;
};

type MinimalDeal = {
  id: number;
  title: string;
  max_savings: string;
};

type MinimalDish = {
  name: string;
  formatted_price: string;
};

export type LickilickyVenue = {
  id: number;
  name: string;
  location: Location;
  banner_url: string;
  dishes: Array<MinimalDish>;
  url: string;
  categories: Array<string>;
  formatted_price: string;
  time_first_added: number;
  deals: Array<MinimalDeal>;
  expiryDate: string | null;
  previous_deals?: Array<MinimalDeal>;
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
    const existingLickilickyVenueResponse: Array<
      LickilickyVenue
    > | null = await got(process.env.PARSED_VENUE_URL).json();
    if (!existingLickilickyVenueResponse)
      throw new Error("Missing existingLickilickyVenueResponse");
    console.log("Get full list of venues from Lickilicky......");
    return existingLickilickyVenueResponse;
  }

  private async _hydrateVenue(
    partialVenue: LickilickyVenue
  ): Promise<LickilickyVenue> {
    const alreadyHydrated = partialVenue.dishes && partialVenue.dishes.length;
    if (alreadyHydrated) return partialVenue;

    const burppleVenue = await this.Burpple.getVenue(partialVenue.id);
    const banner_url = get(burppleVenue, ["images", 0, "medium_url"], "");
    const categories: Array<string> = burppleVenue.categories
      .map((ctg) => ctg.name)
      .filter((name) => !name.includes("Burpple"))
      .filter((name) => !this.REDUNDANT_CATEGORIES.includes(name));
    const mustIncludeCategories = categories.filter((name) =>
      this.ESSENTIAL_CATEGORIES.includes(name)
    );
    const selectedCategories = [categories[0], ...mustIncludeCategories].filter(
      Boolean
    );
    const deals = burppleVenue.beyond
      ? burppleVenue.beyond.redemptions.map((r) => {
          const deal = r.beyond_deal;
          return {
            id: deal.id,
            title: deal.title,
            max_savings: deal.formatted_max_savings,
          };
        })
      : [];
    const dishes = burppleVenue.dishes.map((dish) => ({
      name: dish.name,
      formatted_price: dish.formatted_price,
    }));
    const expiryString = get(
      burppleVenue,
      ["beyond", "venue_additional_info", 0, "title"],
      null
    );
    const expiryDate = expiryString
      ? format(
          parse(
            expiryString.replace("All deals valid till ", ""),
            "d MMM yyyy",
            new Date()
          ),
          "d MMM yyyy"
        )
      : null;

    return {
      ...partialVenue,
      url: burppleVenue.url,
      banner_url,
      categories: selectedCategories,
      dishes,
      deals,
      expiryDate,
    };
  }

  async hydrateAllVenues(
    partialVenues: Array<LickilickyVenue>
  ): Promise<Array<LickilickyVenue>> {
    console.log("Hydrating all venues......");
    const newVenues: Array<LickilickyVenue> = [];
    const promises = partialVenues.map((v) => this._hydrateVenue(v));
    let chunkedPromises = chunk(promises, 1);
    let percentage = 0;
    for (let [index, chunk] of chunkedPromises.entries()) {
      // start random progress
      const newPercentage = Math.floor((index / chunkedPromises.length) * 100);
      if (
        newPercentage - percentage > Math.random() * 50 &&
        newPercentage !== 100
      ) {
        console.log(`...${newPercentage}%`);
        percentage = newPercentage;
      }
      // end random progress
      const results = await Promise.all(chunk);
      results.forEach((result) => newVenues.push(result));
      await sleep(1000 * Math.pow(2, Math.random()) + Math.random() * 100);
    }
    console.log("...100%");
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
        console.log("Venues saved to dist/data/venues.min.json");
      }
    );
  }
}

export default Lickilicky;
