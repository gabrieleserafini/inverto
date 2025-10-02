import type { Rule } from "sanity";

const click = {
  name: "click",
  title: "Click",
  type: "document",
  fields: [
    { name: "clickId", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "campaignId", type: "string" },
    { name: "creatorId", type: "string" },
    { name: "ts", type: "datetime" },
    { name: "userAgent", type: "string" },
  ],
};

export default click;