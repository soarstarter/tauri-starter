import { NavLink } from 'react-router'

export const NotFoundPage = () => (
  <section className="mx-auto max-w-2xl space-y-3">
    <h1 className="text-xl font-semibold">Page not found</h1>
    <p className="text-sm text-muted-foreground">The route does not exist. Use the navigation above to continue.</p>
    <NavLink to="/home" className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
      Go to Home
    </NavLink>
  </section>
)
