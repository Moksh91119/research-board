import { Suspense } from "react";
import AcceptInvitationContent from "./accept-invitation-content";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </main>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
