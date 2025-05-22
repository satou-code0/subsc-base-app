// /api/create-checkout-session APIルート
// Stripe Checkoutセッションを作成し、URLを返すエンドポイント

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Stripeのシークレットキーを環境変数から取得
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json()
    if (!priceId) {
      return NextResponse.json({ error: 'priceIdが指定されていません' }, { status: 400 })
    }

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=1`,
      // ユーザー認証済みの場合はcustomer_emailなども指定可能
    })

    // CheckoutページのURLを返す
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    // エラー時はメッセージを返す
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- 解説 ---
// ・POSTでpriceIdを受け取り、StripeのCheckoutセッションを作成します
// ・成功時はCheckoutページのURLを返します
// ・.env.localにSTRIPE_SECRET_KEYとNEXT_PUBLIC_BASE_URLを設定してください 