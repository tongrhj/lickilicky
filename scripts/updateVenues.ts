import BurppleBeyondService from "../lib/domains/burpple";
import LickilickyService, { LickilickyVenue } from "../lib/domains/lickilicky";
import MapperService from "../lib/mapper";

const BURPPLE_TOKEN = process.env.BURPPLE_AUTH_TOKEN;

type CompareVenueResponse = {
  updatedVenues: Array<LickilickyVenue>;
  removedVenues: Array<LickilickyVenue>;
};

const updateVenues = async (): Promise<CompareVenueResponse> => {
  if (!BURPPLE_TOKEN) {
    throw new Error(`Missing required Burpple Beyond token`);
  }
  const Burpple = new BurppleBeyondService(BURPPLE_TOKEN);
  const Lickilicky = new LickilickyService(Burpple);
  const Mapper = new MapperService();

  const beyondVenues = await Burpple.getVenues();
  const lickilickyVenues = await Lickilicky.getVenues();

  if (!lickilickyVenues) throw new Error(`Missing lickilickyVenues`);

  const updatedLickilickyVenues = beyondVenues.map((venue) =>
    Mapper.mapToLickilickyVenue(venue, lickilickyVenues)
  );
  const hydratedUpdatedVenues = await Lickilicky.hydrateAllVenues(
    updatedLickilickyVenues
  );

  const removedVenues = Lickilicky.removedVenues(
    hydratedUpdatedVenues,
    lickilickyVenues
  );
  const allVenues = hydratedUpdatedVenues.concat(removedVenues);
  await Lickilicky.replaceExistingVenues(allVenues);

  return {
    updatedVenues: hydratedUpdatedVenues,
    removedVenues,
  };
};

export default updateVenues;
