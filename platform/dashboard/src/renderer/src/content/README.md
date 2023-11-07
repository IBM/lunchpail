# How To: Add New Kinds of Resources

There are three places in the UI side you will need to update:

1. Add a UI provider in [providers.ts](./providers.ts). This will
   teach the system how to render your new kind of resource. You only
   need to add an entry here if your new type will have direct UI
   contributions, e.g. one of the Gallery, the Sidebar, the Detail
   view, or a Wizard view.
2. Add a type mapping in [ManagedEvent.ts](./ManagedEvent.ts) from
   your resource's Kind to the type of event that will flow out of the
   backend; e.g. kind `applications` corresponds to event type
   `ApplicationSpecEvent`. The names here are up to you, but it is
   necessary to teach the system this mapping, so that it can do
   proper type checking for you.
3. Add a state implementation in [state.ts](./state.ts). You will need
   to do this for every kind of watched resource, even if it does not
   participate directly in the UI.

## Optional: Memos

If your UI implementations need a [React
memo](https://react.dev/reference/react/memo), you can implement this
in [memos.ts](./memos.ts)
