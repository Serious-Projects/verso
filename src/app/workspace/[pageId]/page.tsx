import { Editor } from "@/components/editor/editor";

/**
 * PageRoute is a Next.js page route that takes a pageId as a parameter,
 * loads the corresponding page content from the store, and renders an
 * Editor component with the pageId as a prop.
 *
 * @param {params} - an object containing a pageId as a string
 * @returns {Promise<JSX.Element>} - a JSX element representing the page content
 */
export default async function PageRoute({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  return <Editor key={pageId} pageId={pageId} />;
}
