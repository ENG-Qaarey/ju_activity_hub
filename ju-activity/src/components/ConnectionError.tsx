import { useEffect, useMemo, useState } from "react";
import { XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError, setApiErrorHandler } from "@/lib/api";

type Info = {
  title: string;
  description: string;
  canRetry: boolean;
};

function toInfo(error: ApiError): Info | null {
  if (error.status === 0) {
    return {
      title: "Network Error",
      description:
        "Unable to connect to the server. Please check your internet connection and try again.",
      canRetry: true,
    };
  }

  return null;
}

export default function ConnectionError() {
  const [open, setOpen] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  const info = useMemo(() => {
    if (!lastError) return null;
    return toInfo(lastError);
  }, [lastError]);

  useEffect(() => {
    setApiErrorHandler((error) => {
      const mapped = toInfo(error);
      if (!mapped) return;
      setLastError(error);
      setOpen(true);
    });

    return () => setApiErrorHandler(null);
  }, []);

  if (!info) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {info.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{info.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {info.canRetry ? (
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                // Retry is page-specific; user can click their button again.
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              OK
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
