const metricProduct = {
  name: "metricProduct",
  title: "Product Metric",
  type: "document",
  fields: [
    { name: "campaignRef", title: "Campaign", type: "reference", to: [{ type: "campaign" }] },
    { name: "creatorRef", title: "Creator", type: "reference", to: [{ type: "creator" }] },
    { name: "title", type: "string" },
    { name: "qty", type: "number" },
    { name: "revenue", type: "number" },
  ],
};

export default metricProduct;
