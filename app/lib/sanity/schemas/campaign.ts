import type { Rule } from "sanity";

const campaign = {
  name: "campaign",
  title: "Campaign",
  type: "document",
  fields: [
    { name: "campaignId", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "name", type: "string" },
    { name: 'shop', type: 'string' },            
    { name: 'defaultLanding', type: 'url' },     // URL su cui mandare i link se non specificato
    { name: 'enabled', type: 'boolean' },  // collegata/gestita solo su Inflead
  ],
};

export default campaign;