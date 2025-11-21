"use client";

import { signOut } from "next-auth/react";

export default function AdminHeader() {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => signOut()}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
