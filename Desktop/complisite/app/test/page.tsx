export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">✅ Application is Working!</h1>
        <p className="text-gray-600 mb-4">Your Next.js application is running properly.</p>
        <div className="space-y-2">
          <p className="text-sm text-green-600">✓ Server is running</p>
          <p className="text-sm text-green-600">✓ Styling is working</p>
          <p className="text-sm text-green-600">✓ React components are rendering</p>
        </div>
        <div className="mt-6">
          <a 
            href="/auth/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
