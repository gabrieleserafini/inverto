import type { Rule } from "sanity";

const campaign = {
  name: "campaign",
  title: "Campaign",
  type: "document",
  fields: [
    { name: "campaignId", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "name", type: "string" },
  ],
};

export default campaign;