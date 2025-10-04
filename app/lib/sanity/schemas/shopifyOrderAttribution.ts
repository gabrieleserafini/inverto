const shopifyOrderAttribution = {
  name: 'shopifyOrderAttribution',
  type: 'document',
  title: 'Shopify Order Attribution',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'codes', type: 'array', of: [{ type: 'string' }] },
    { name: 'shop', type: 'string' },
    { name: 'createdAt', type: 'datetime' },
  ],
};

export default shopifyOrderAttribution;