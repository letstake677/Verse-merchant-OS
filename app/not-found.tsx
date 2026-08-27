import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-slate-600 mb-8">Could not find requested resource</p>
      <Link href="/" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
        Return Home
      </Link>
    </div>
  )
}
