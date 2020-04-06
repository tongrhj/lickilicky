import { BurppleVenue } from "./domains/burpple";
import { LickilickyVenue } from "./domains/lickilicky";

class Mapper {
  mapToLickilickyVenue(
    beyondVenue: BurppleVenue,
    existingLickilickyVenues: Array<LickilickyVenue>
  ): LickilickyVenue {
    const previousVenue = existingLickilickyVenues.find(
      (lickilickyVenue) => lickilickyVenue.id === beyondVenue.id
    );
    const bv = beyondVenue;
    return {
      id: bv.id,
      name: bv.name,
      formatted_price: bv.formatted_price || "",
      newly_added: !previousVenue,
      returning: !!(previousVenue && previousVenue.removed),
      time_first_added: previousVenue
        ? previousVenue.time_first_added
        : Date.now(),
      removed: false,
      dishes: [],
      url: "",
      location: {
        address: [
          bv.location.address_2,
          bv.location.street,
          bv.location.zipcode,
        ]
          .filter(Boolean)
          .join(", "),
        longitude: bv.location.longitude,
        latitude: bv.location.latitude,
        neighbourhood: bv.location.neighbourhood,
      },
      banner_url: "",
      categories: [],
      deals: [],
      expiryDate: "",
    };
  }
}

export default Mapper;
