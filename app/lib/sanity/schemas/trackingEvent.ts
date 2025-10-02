const trackingEvent = {
  name: 'trackingEvent',
  title: 'Tracking Event',
  type: 'document',
  fields: [
    { name: 'event', type: 'string' },
    { name: 'ts', type: 'datetime' },
    { name: 'sessionId', type: 'string' },
    { name: 'campaignId', type: 'string' },
    { name: 'creatorId', type: 'string' },
    { name: 'clickId', type: 'string' },
    { name: 'source', type: 'string' },
    {
      name: 'utm',
      type: 'object',
      fields: [
        { name: 'utm_source', type: 'string' },
        { name: 'utm_medium', type: 'string' },
        { name: 'utm_campaign', type: 'string' },
        { name: 'utm_content', type: 'string' },
        { name: 'utm_term', type: 'string' },
      ],
    },
    {
      name: 'payload',
      title: 'Payload',
      type: 'object',
      fields: [
        { name: 'orderId', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'productId', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'cartValue', type: 'number' },
        { name: 'itemsCount', type: 'number' },
      ],
    },
  ],
} as const;

export default trackingEvent;
