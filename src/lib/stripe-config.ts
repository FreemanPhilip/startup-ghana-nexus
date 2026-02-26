// Stripe product/price IDs for the platform
export const STRIPE_CONFIG = {
  premium: {
    product_id: "prod_U2zuh1PJoNbQUs",
    price_id: "price_1T4tuXHHxjvxNyz0U3MFhoue",
    name: "Premium Membership",
    price: 49.99,
    currency: "USD",
    interval: "month",
  },
} as const;

// Standard member limits (for startup founders)
export const STANDARD_LIMITS = {
  maxConnections: 50,
  maxMessages: 20,        // per day
  maxPosts: 5,            // per day
  canAccessAdvancedSearch: false,
  canSeeInvestorContact: false,
  canCreateOpportunities: false,
  maxGroupsJoin: 5,
  pitchDeckUploads: 1,
  canExportData: false,
  featuredListing: false,
} as const;

export const PREMIUM_LIMITS = {
  maxConnections: Infinity,
  maxMessages: Infinity,
  maxPosts: Infinity,
  canAccessAdvancedSearch: true,
  canSeeInvestorContact: true,
  canCreateOpportunities: true,
  maxGroupsJoin: Infinity,
  pitchDeckUploads: Infinity,
  canExportData: true,
  featuredListing: true,
} as const;

export type MembershipTier = "standard" | "premium";

export const getMembershipLimits = (tier: MembershipTier) => {
  return tier === "premium" ? PREMIUM_LIMITS : STANDARD_LIMITS;
};
