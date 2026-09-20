import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataLoadErrorProps {
  /** What failed to load, e.g. "startups". Used in the message. */
  entity?: string;
  onRetry?: () => void;
}

/**
 * Shown when a backend request fails. Without this, a failed request renders
 * the same "nothing found" empty state as a genuinely empty result, which
 * makes an outage look like missing data.
 */
const DataLoadError = ({ entity = "data", onRetry }: DataLoadErrorProps) => (
  <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-12 text-center">
    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive/70" />
    <p className="text-lg font-medium">Couldn't load {entity}</p>
    <p className="text-sm mt-1 text-muted-foreground">
      Something went wrong reaching the server. This isn't an empty list — please try again.
    </p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Retry
      </Button>
    )}
  </div>
);

export default DataLoadError;
