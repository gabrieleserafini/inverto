import type { Rule } from 'sanity';

const creator = {
  name: 'creator',
  title: 'Creator',
  type: 'document',
  fields: [
    { name: 'creatorId', type: 'string', validation: (rule: Rule) => rule.required() },
    { name: 'handle', type: 'string' },
    { name: 'name', type: 'string' },
  ],
} as const;

export default creator;
