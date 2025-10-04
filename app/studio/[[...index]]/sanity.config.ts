import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure' 
import {visionTool} from '@sanity/vision'

import campaign from '@/lib/sanity/schemas/campaign'
import creator from '@/lib/sanity/schemas/creator'
import campaignCreatorLink from '@/lib/sanity/schemas/campaignCreatorLink'
import click from '@/lib/sanity/schemas/click'
import trackingEvent from '@/lib/sanity/schemas/trackingEvent'
import campaignMetricsDaily from '@/lib/sanity/schemas/campaignMetricsDaily'
import shopifyWebhookLog from '@/lib/sanity/schemas/shopifyWebhookLog'
import shopifyOrderAttribution from '@/lib/sanity/schemas/shopifyOrderAttribution'

export default defineConfig({
  name: 'default',
  title: 'Datalayer Studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [
    structureTool(),   
    visionTool(),      
  ],
  schema: {
    types: [
      campaign,
      creator,
      campaignCreatorLink,
      click,
      trackingEvent,
      campaignMetricsDaily,
      shopifyWebhookLog,
      shopifyOrderAttribution,
    ],
  },
})
