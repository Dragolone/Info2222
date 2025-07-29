"use client";

import { useEffect, useState } from 'react';

export default function SecurePage() {
  const [isSecure, setIsSecure] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if connection is secure
    setIsSecure(window.location.protocol === 'https:');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Secure Page Demo</h1>

        {isSecure === null ? (
          <p className="text-gray-500">Checking connection security...</p>
        ) : isSecure ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">Connection is secure!</p>
            <p className="text-gray-600">
              You're viewing this page over HTTPS with a locally-trusted certificate created with mkcert.
            </p>
            <div className="mt-6 bg-gray-50 p-4 rounded text-sm text-gray-700">
              <p className="font-bold mb-2">Connection Details:</p>
              <p>Protocol: {window.location.protocol}</p>
              <p>Host: {window.location.host}</p>
              <p>Pathname: {window.location.pathname}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-2">Connection is not secure!</p>
            <p className="text-gray-600">
              You're viewing this page over HTTP. Try accessing it using HTTPS.
            </p>
            <div className="mt-4">
              <a
                href="https://localhost:3001/secure"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Try Secure Connection
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
