import notifyTelegram from "./notifyTelegram";
import moment from "moment";
import { CookieJar } from "tough-cookie";
import BurppleBeyondService, { BurppleVenue } from "../lib/domains/burpple";
import LickilickyService, {
  LickilickyVenue,
  Location,
} from "../lib/domains/lickilicky";
import MapperService from "../lib/mapper";
import { contains } from "../lib/helpers";

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;
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

  const updatedLickilickyVenues = beyondVenues.map((venue: BurppleVenue) =>
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
