const campaignMetricsDaily = {
  name: "campaignMetricsDaily",
  title: "Campaign Metrics (Daily)",
  type: "document",
  fields: [
    { name: "campaignId", type: "string" },
    { name: "creatorId", type: "string" },
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