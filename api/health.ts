export default async function handler(req: any, res: any) {
  const stripeKeySet = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'))
  const supaUrlSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supaServiceSet = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  res.status(200).json({ ok: true, stripeKeySet, supaUrlSet, supaServiceSet })
}


