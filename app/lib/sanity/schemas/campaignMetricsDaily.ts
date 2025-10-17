const campaignMetricsDaily = {
  name: "metricDaily",
  title: "Campaign Metrics (Daily)",
  type: "document",
  fields: [
    { name: "campaignRef", title: "Campaign", type: "reference", to: [{ type: "campaign" }] },
    { name: "creatorRef", title: "Creator", type: "reference", to: [{ type: "creator" }] },
    { name: "date", type: "date" },
    { name: "pageViews", type: "number" },
    { name: "addToCart", type: "number" },
    { name: "beginCheckout", type: "number" },
    { name: "purchases", type: "number" },
    { name: "revenue", type: "number" },
    { name: "cvr", type: "number" },
    { name: "abandonRate", type: "number" },
    { name: "aov", type: "number" },
  ],
}

export default campaignMetricsDaily;