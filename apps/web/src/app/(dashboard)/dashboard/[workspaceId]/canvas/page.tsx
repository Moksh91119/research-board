import ResearchCanvas from "@/components/canvas/research-canvas";

type CanvasPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  await params;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Research Canvas</h1>
        <p className="text-sm text-slate-500">
          Arrange and connect your research visually.
        </p>
      </div>

      <ResearchCanvas />
    </div>
  );
}
