// /api/webhook.ts：Stripe Webhook受信・DB反映エンドポイント
// Stripeからのイベントを受信し、Supabaseのsubscriptionsテーブルを更新します

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Supabaseサービスロールキーで管理者権限クライアントを作成
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
})

export const config = {
  api: {
    bodyParser: false, // Stripe署名検証のため生データで受け取る
  },
}

import { buffer } from 'micro'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET as string)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // イベントごとに処理を分岐
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // 顧客IDやサブスクIDを取得
      const userId = session.metadata?.user_id // 必要に応じてmetadataでuser_idを渡す
      const stripeCustomerId = session.customer as string
      const stripeSubscriptionId = session.subscription as string
      // サブスク情報をDBに保存
      if (userId) {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          status: 'active',
          current_period_end: null,
        })
      }
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      // サブスクのステータスをactiveに更新
      await supabase.from('subscriptions').update({ status: 'active' })
        .eq('stripe_subscription_id', invoice.subscription as string)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // サブスクのステータスをcanceledに更新
      await supabase.from('subscriptions').update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
    default:
      // 他のイベントはログのみ
      console.log(`Unhandled event type: ${event.type}`)
  }
  res.status(200).json({ received: true })
}

// --- 解説 ---
// ・StripeのWebhookイベントを受信し、subscriptionsテーブルを更新します
// ・checkout.session.completed, invoice.paid, customer.subscription.deletedに対応
// ・metadataでuser_idをCheckoutセッションに渡す実装が必要です
// ・.env.localにSTRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEYを設定してください 