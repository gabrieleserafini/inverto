import type { Rule } from "sanity";

const trackingLink = {
  name: "trackingLink",
  title: "Tracking Link",
  type: "document",
  fields: [
    { name: "scope", type: "string" },
    {
      name: "campaignRef",
      title: "Campaign",
      type: "reference",
      to: [{ type: "campaign" }],
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: "creatorRef",
      title: "Creator",
      type: "reference",
      to: [{ type: "creator" }],
      validation: (Rule: Rule) => Rule.required(),
    },
    { name: "redirectPath", type: "string" },
    { name: "createdAt", type: "datetime" },
  ],
};

export default trackingLink;
