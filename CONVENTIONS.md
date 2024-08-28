# Coding conventions for BikeHopper UI

## React

- Components should be in a file ComponentName.tsx that exports only the
  component
- Keep props semantic. Don't unnecessarily refer to how the child component
  renders something
  - Instead of: `displayArrow={true}`
  - Use: `expandable={true}`
- Minimize number of props
  - Instead of: `removable={true} onRemoveClick={handleRemove}`
  - Just use `onRemoveClick` and check if it's non-null
- Use function components with hooks rather than class components
- Don't make random elements like a div or span or icon clickable. Use a
  `<button>` so there's good keyboard, accessibility, and cursor support. Use
  `<BorderlessButton>` utility class to reset the button styling when needed.

## Modules

- Use `import`, `export`, not `require()` or `module.exports`
- Prefix module-local constants or utility functions with `_`
- Prefer to define module-local helper functions at the end of the file to
  avoid writing the module "inside out"
- Name utility modules with an initial capital letter if they are class-like
  (export multiple functions or constants), initial lowercase letter if they
  export a single function

## TypeScript

- Use it for new or substantially rewritten code

## Styling

- For new code, use [Tailwind CSS](https://tailwindcss.com/docs)
- Lots of existing code uses BEM-style classes and ComponentName.css files.
  You may continue using this convention when making small changes to
  such components. Alternatively, it's good to incrementally migrate
  away from this
- Avoid violating the conventions of the BEM-style classes by, for
  example, having ComponentA.css contain a rule that references a
  `.ComponentB_foo` class

## State

- Each specific concern (e.g. route parameters) should have both its reducer
  and Redux action creators in a feature module (e.g.
  src/features/routeParams.js)
- Use local component state (`useState`) for transient UI state that is only
  needed by one component and its descendants
- Use global Redux state if something is needed by multiple components that
  don't have a straightforward parent-child relationship, or if state needs to
  persist when switching between different screens in the app

## Meta

- These might not all be consistently followed
- These might not be all the coding conventions we have implicitly been
  following
- Deviate from these before writing something horrible
