import { Editor } from "@/components/editor/editor";

export default async function PageRoute({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  return <Editor key={pageId} pageId={pageId} />;
}
