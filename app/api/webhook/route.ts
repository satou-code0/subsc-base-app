// /api/webhook/route.ts：Stripe Webhook受信・DB反映エンドポイント（App Router対応）
// Stripeからのイベントを受信し、Supabaseのsubscriptionsテーブルを更新します

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Supabaseサービスロールキーで管理者権限クライアントを作成
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  // Stripe署名検証のため生データを取得
  const buf = Buffer.from(await req.arrayBuffer())
  const sig = req.headers.get('stripe-signature') as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET as string)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
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
      const subscriptionId = (invoice as any).subscription
      if (subscriptionId) {
        await supabase.from('subscriptions').update({ status: 'active' })
          .eq('stripe_subscription_id', subscriptionId)
      }
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
  return NextResponse.json({ received: true })
}

// --- 解説 ---
// ・App Router形式ではmicroは不要、req.arrayBuffer()で生データ取得
// ・StripeのWebhookイベントを受信し、subscriptionsテーブルを更新
// ・checkout.session.completed, invoice.paid, customer.subscription.deletedに対応
// ・metadataでuser_idをCheckoutセッションに渡す実装が必要
// ・.env.localにSTRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEYを設定してください 