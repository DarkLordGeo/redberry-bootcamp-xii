import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
      <p className="display text-[96px] text-brass">404</p>
      <h1 className="text-2xl font-semibold">This page isn’t showing</h1>
      <p className="text-mute">The link may be old, or the film has left the programme.</p>
      <Link to="/" className="mt-2 rounded-md bg-velvet px-5 py-3 font-semibold hover:bg-velvet-hi">
        Back to home
      </Link>
    </div>
  )
}
