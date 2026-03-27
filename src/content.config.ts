import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reviewSchema = z.object({
  name: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  text: z.string(),
  date: z.string(),
  verified: z.boolean().default(true),
});

const flavourSchema = z.object({
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  image: z.string(),
  inStock: z.boolean(),
  isNew: z.boolean().default(false),
  rating: z.number().min(1).max(5).default(5),
  description: z.string().optional(),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    puffs: z.number(),
    price: z.number(),
    description: z.string(),
    image: z.string(),
    isNew: z.boolean().default(false),
    flavours: z.array(flavourSchema),
    reviews: z.array(reviewSchema).optional(),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/locations' }),
  schema: z.object({
    title: z.string(),
    state: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { products, locations };
