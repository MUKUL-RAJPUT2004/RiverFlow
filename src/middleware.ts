import { NextResponse, NextRequest } from 'next/server'

import getOrCreateDb from './models/server/dbSetup'
import getOrCreateStorage from './models/server/storage.setup'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    await Promise.all([
        getOrCreateDb(),
        getOrCreateStorage()
    ]);
    return NextResponse.next();
}
 
export const config = {
    /*this middleware will not run for these matcher routes
        - api
        - _next/statis
        - _next/image
        - favicon.com
    */
  matcher: [
    
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ],     

}