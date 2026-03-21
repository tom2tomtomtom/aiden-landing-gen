import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <span className="text-2xl font-bold tracking-tight text-gray-900">AIDEN</span>
        <p className="mt-6 text-6xl font-bold text-gray-900">404</p>
        <p className="mt-4 text-lg text-gray-600">Page not found.</p>
        <p className="mt-2 text-sm text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-gray-900 text-white text-sm font-medium px-6 py-3 hover:bg-gray-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
