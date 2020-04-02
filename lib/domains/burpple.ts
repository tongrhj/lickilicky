import { CookieJar } from "tough-cookie";
import got from "got";

type GenericBurppleResponse<D> = {
  body: {
    meta: {
      code: number;
    };
    data: D;
  };
};

type BurppleLocation = {
  city: string;
  country: string;
  state: string;
  street: string;
  address_2: string;
  zipcode: number;
  longitude: number;
  latitude: number;
  neighbourhood: string;
};

type MinimalBurppleVenue = {
  id: number;
  name: string;
  location: BurppleLocation;
};

export type BurppleVenue = MinimalBurppleVenue & {
  formatted_price: null | string;
  beyond_partner: boolean;
  beyond_newly_added: boolean;
  open_now: boolean;
  avatar: {
    small_url: string;
    medium_url: string;
    url: string;
  };
};

type BurppleCategory = {
  id: number;
  name: string;
};

type BurppleVenueImage = {
  url: string;
  medium_url: string;
  large_url: string;
};

type BurppleFoodWithReview = {
  id: number;
  name: string;
  description: string;
  date: string;
  updated_at: string;
  created_at: string;
  image: {
    url: string;
    width: number;
    height: number;
    large_url: string;
    medium_url: string;
    small_url: string;
    large: any;
    medium: any;
    small: any;
  };
  box: {
    id: number;
    name: string;
  };
  user: any;
};

export type BeyondDeal = {
  id: number;
  title: string;
  description: string;
  short_description: string;
  hint: string;
  max_savings: number;
  formatted_max_savings: string;
  expires_at: string;
  formatted_expires_at: string;
  successful_hint: string;
  partner_success_message: string;
  redemption_timings_url: string;
  additional_info: Array<{
    title: string;
  }>;
  venue: MinimalBurppleVenue;
};

type BeyondDealWithMeta = {
  path: string;
  id: null | number;
  ref_id: null | string;
  redeemed: boolean;
  reedemed_at: string;
  plan_id: string;
  status: string;
  status_message: null | string;
  show_locked: null | boolean;
  beyond_deal: BeyondDeal;
};

type FullBurppleVenue = MinimalBurppleVenue & {
  wish_id: null | number;
  url: string;
  formatted_price: string;
  beyond_partner: boolean;
  is_wishlist: boolean;
  open_now: boolean;
  avatar: {
    small_url: string;
    medium_url: string;
    url: string;
  };
  counts: {
    recommendations: number;
    foods: number;
    wishes: number;
    guides: number;
    dishes: number;
  };
  categories: Array<BurppleCategory>;
  images: Array<BurppleVenueImage>;
  conditions: {
    open_now: boolean;
    wishlist: boolean;
    pending_feedback: boolean;
    newly_opened: boolean;
    trending: boolean;
  };
  bio: string;
  phone: string;
  website: string;
  hours: Array<{
    day: string;
    hours: Array<string>;
  }>;
  foods: Array<BurppleFoodWithReview>;
  promotions: Array<any>;
  dishes: Array<any>;
  reservation_links: Array<any>;
  delivery_links: Array<any>;
  tags: Array<any>;
  scoop: any;
  additional_highlights: Array<any>;
  beyond: {
    description: string;
    user_subscription: any;
    redemptions: Array<BeyondDealWithMeta>;
    venue_additional_info: Array<{
      title: string;
      sub_title: null | string;
      sub_title_url: null | string;
    }>;
  };
};

type BurppleVenuesResponse = GenericBurppleResponse<Array<BurppleVenue>>;

type BurppleVenueResponse = GenericBurppleResponse<FullBurppleVenue>;

class BurppleBeyond {
  private readonly token: string;
  private readonly CookieJar: CookieJar;

  constructor(token: string) {
    this.token = token;
    this.CookieJar = new CookieJar();
  }

  async getVenues(): Promise<Array<BurppleVenue>> {
    const response: BurppleVenuesResponse | null = await got(
      `https://app.burpple.com/p1/beyond/venues?auth_token=${this.token}`,
      {
        json: true,
        headers: {
          "user-agent": "Burpple Beyond Fans https://t.me/burpplebeyond",
        },
      }
    );
    if (!response) throw new Error("Get request failed");
    return response.body.data;
  }

  async getVenue(id: number): Promise<FullBurppleVenue> {
    const response: BurppleVenueResponse | null = await got(
      `https://app.burpple.com/p1/venues/${id}?auth_token=${this.token}`,
      {
        json: true,
        headers: {
          "user-agent": "Burpple Beyond Fans https://t.me/burpplebeyond",
        },
        cookieJar: this.CookieJar,
      }
    );
    if (!response) throw new Error("Get request failed");
    return response.body.data;
  }
}

export default BurppleBeyond;
