import DocumentEditor from "@/components/documents/document-editor";

type DocumentPageProps = {
  params: Promise<{
    workspaceId: string;
    documentId: string;
  }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = await params;

  return <DocumentEditor documentId={documentId} />;
}
