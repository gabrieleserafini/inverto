import type { Rule } from 'sanity';

const shopifyWebhookLog = {
  name: 'shopifyWebhookLog',
  title: 'Shopify Webhook Log',
  type: 'document',
  fields: [
    { name: 'topic', type: 'string', validation: (Rule: Rule) => Rule.required() },
    { name: 'shop', type: 'string' },
    { name: 'receivedAt', type: 'datetime', validation: (Rule: Rule) => Rule.required() },
    { name: 'payload', type: 'json', validation: (Rule: Rule) => Rule.required() },
    { name: 'status', type: 'string', options: { list: ['stored', 'error'] } },
  ],
};

export default shopifyWebhookLog;