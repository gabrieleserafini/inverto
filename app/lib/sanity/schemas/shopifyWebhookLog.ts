const shopifyWebhookLog = {
    name: 'shopifyWebhookLog',
    title: 'Shopify Webhook Log',
    type: 'document',
    fields: [
        { name: 'topic', type: 'string' },
        { name: 'shop', type: 'string' },
        { name: 'receivedAt', type: 'datetime' },
        { name: 'payload', type: 'object' },
        { name: 'status', type: 'string' },
    ],
};

export default shopifyWebhookLog;