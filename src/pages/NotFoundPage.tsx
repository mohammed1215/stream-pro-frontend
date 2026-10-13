import { Link } from "react-router-dom"

export const NotFoundPage = () => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
    <h1 className="text-2xl font-bold">Page not found</h1>
    <p className="text-sm text-muted-foreground">
      The page you are looking for does not exist.
    </p>
    <Link
      to="/"
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      Go home
    </Link>
  </div>
)
