// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ token, req }) => {
      // Allow access to admin routes only for admins
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token?.role === "admin";
      }
      // Allow access to other protected routes
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/backend/:path*"],
};
