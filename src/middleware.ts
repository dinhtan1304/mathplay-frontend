import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/exams',
  '/bank',
  '/upload',
  '/generate',
  '/classes',
  '/assignments',
  '/chat',
  '/profile',
  '/admin',
]

// Routes only accessible to unauthenticated users
const AUTH_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth indicator cookie (set by AuthProvider on login)
  // Actual token validation is done by the backend API
  const hasToken = request.cookies.get('has_token')?.value === '1'

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  if (isProtected && !hasToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and tries to access login/register, redirect to dashboard
  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, and api
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
