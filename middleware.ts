// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // DISABLE_MIDDLEWARE=trueの場合のみmiddlewareを無効化
  if (process.env.DISABLE_MIDDLEWARE === 'true') {
    return NextResponse.next()
  }

  // API Routeは除外（重要）
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ログインページは除外
  if (req.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const isDev = process.env.NODE_ENV === 'development'
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // ローカル開発環境用のCookie設定
            const cookieOptions = isDev ? {
              ...options,
              httpOnly: false,
              secure: false,
              sameSite: 'lax' as const,
              path: '/',
            } : options

            try {
              res.cookies.set(name, value, cookieOptions)
            } catch (error) {
              if (isDev) {
                console.error('Middleware: Cookie set failed:', name, error)
              }
            }
          })
        },
      },
    }
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // 未認証ユーザーはログインページへ
    if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return res
  } catch (error) {
    if (isDev) {
      console.error('Middleware: Auth error:', error)
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

// middleware.tsの末尾に追加 ログインしていないユーザーが/dashboardにアクセスした場合にリダイレクトする
export const config = {
  matcher: ['/dashboard/:path*'],
}
  