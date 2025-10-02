import type { Rule } from "sanity";

const campaignCreatorLink = {
  name: "campaignCreatorLink",
  title: "Campaign ↔ Creator Link",
  type: "document",
  fields: [
    { name: "campaignId", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "creatorId", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "landingUrl", type: "url" },
    { name: "shortCode", type: "string" },
    { name: "couponCode", type: "string" },
    { name: "utmContent", type: "string" },
  ],
};

export default campaignCreatorLink;