// /api/create-checkout-session APIルート
// Stripe Checkoutセッションを作成し、URLを返すエンドポイント

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント（サーバー認証用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

// Stripeのシークレットキーを環境変数から取得
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json()
    if (!priceId) {
      return NextResponse.json({ error: 'priceIdが指定されていません' }, { status: 400 })
    }

    // ユーザーIDがリクエストから渡されない場合、Cookieから認証情報を取得
    let authUserId = userId;
    
    // ユーザーIDを確認
    if (!authUserId) {
      // Cookieから認証情報を取得する試み
      const authCookie = req.cookies.get('supabase-auth-token')?.value;
      if (authCookie) {
        try {
          const token = JSON.parse(authCookie)[0];
          const { data, error } = await supabase.auth.getUser(token);
          if (data?.user) {
            authUserId = data.user.id;
          }
        } catch (e) {
          console.error('認証Cookie解析エラー:', e);
        }
      }
      
      if (!authUserId) {
        return NextResponse.json({ error: 'ユーザー認証情報が取得できません' }, { status: 400 });
      }
    }

    // Price IDの存在確認（デバッグ用）
    try {
      await stripe.prices.retrieve(priceId);
    } catch (e: any) {
      return NextResponse.json({ 
        error: `無効なPrice ID: ${e.message}`,
        debug: {
          price_id: priceId,
          // APIキーの有効性確認（最初の数文字のみ表示で安全性確保）
          key_hint: process.env.STRIPE_SECRET_KEY 
            ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...` 
            : 'not set'
        }
      }, { status: 400 });
    }

    // Stripe Checkoutセッションを作成
    try {
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
        // 重要: ユーザーIDをメタデータとして保存（WebhookでDBを更新する際に必要）
        metadata: {
          user_id: authUserId
        }
      })

      // CheckoutページのURLを返す
      return NextResponse.json({ url: session.url })
    } catch (e: any) {
      // Stripeエラーのより詳細な情報を返す
      return NextResponse.json({ 
        error: `Stripeエラー: ${e.message}`,
        debug: {
          code: e.code,
          type: e.type,
          base_url: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
          user_id: authUserId || 'not found'
        }
      }, { status: 400 });
    }
  } catch (error: any) {
    // その他のエラー（JSON解析エラーなど）
    return NextResponse.json({ error: `リクエスト処理エラー: ${error.message}` }, { status: 500 })
  }
}

// --- 解説 ---
// ・POSTでpriceIdを受け取り、StripeのCheckoutセッションを作成します
// ・成功時はCheckoutページのURLを返します
// ・.env.localにSTRIPE_SECRET_KEYとNEXT_PUBLIC_BASE_URLを設定してください 