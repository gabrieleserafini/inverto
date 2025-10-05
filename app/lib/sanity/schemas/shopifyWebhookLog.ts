import type { Rule } from 'sanity';

const shopifyWebhookLog = {
  name: 'shopifyWebhookLog',
  title: 'Shopify Webhook Log',
  type: 'document',
  fields: [
    { name: 'topic', type: 'string', validation: (Rule: Rule) => Rule.required() },
    { name: 'shop', type: 'string' },
    { name: 'receivedAt', type: 'datetime', validation: (Rule: Rule) => Rule.required() },
    {
      name: 'payload',
      title: 'Payload (JSON)',
      type: 'object',
      fields: [
        {
          name: 'raw',
          type: 'text',
          description: 'Body del webhook serializzato come JSON',
          validation: (Rule: Rule) => Rule.required(),
        },
      ],
      options: { collapsible: true, collapsed: true },
    },
    { name: 'status', type: 'string', options: { list: ['stored', 'error'] } },
    { name: 'error', type: 'text' },
  ],
};

export default shopifyWebhookLog;
