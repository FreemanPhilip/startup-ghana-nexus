import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { formatStage, formatSector, type IndexStartup } from "@/hooks/useIndexStartups";

interface IndexStartupCardProps {
  startup: IndexStartup;
  onClick: () => void;
}

export function IndexStartupCard({ startup, onClick }: IndexStartupCardProps) {
  const initials = startup.name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {startup.logo_url ? (
            <img
              src={startup.logo_url}
              alt={startup.name}
              className="w-12 h-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {startup.name}
              </h3>
              {startup.verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              {startup.is_raising && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30 shrink-0">
                  Raising
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {(startup.city || startup.country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[startup.city, startup.country].filter(Boolean).join(", ")}
                </span>
              )}
              {startup.founded_year && (
                <span>Founded {startup.founded_year}</span>
              )}
            </div>
          </div>
          {startup.sparkx_score != null && (
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-primary">{startup.sparkx_score}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
            </div>
          )}
        </div>
        {startup.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {startup.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {startup.sector && (
            <Badge variant="secondary" className="text-xs">
              {formatSector(startup.sector)}
            </Badge>
          )}
          {startup.stage && (
            <Badge variant="outline" className="text-xs">
              {formatStage(startup.stage)}
            </Badge>
          )}
          {startup.team_size && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {startup.team_size}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
