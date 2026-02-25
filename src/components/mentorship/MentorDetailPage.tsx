import { useState } from "react";
import { ArrowLeft, Star, Clock, MapPin, Briefcase, Calendar, CheckCircle2, Award, MessageCircle, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { MentorData } from "./MentorCard";
import { useToast } from "@/hooks/use-toast";
import QuickChatDialog from "@/components/messages/QuickChatDialog";
import BookSessionDialog from "./BookSessionDialog";

interface MentorDetailPageProps {
  mentor: MentorData;
  onBack: () => void;
  onOpenMessages?: () => void;
}

const MentorDetailPage = ({ mentor, onBack, onOpenMessages }: MentorDetailPageProps) => {
  const { toast } = useToast();
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const initials = mentor.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  const demoReviews = [
    { name: "Ama K.", rating: 5, text: "Incredibly insightful session. Got actionable advice for our Series A preparation.", date: "2 weeks ago" },
    { name: "Kwesi M.", rating: 4, text: "Very knowledgeable mentor. Helped clarify our go-to-market strategy.", date: "1 month ago" },
    { name: "Efua D.", rating: 5, text: "Best mentorship session I've had. Clear, structured, and deeply helpful.", date: "2 months ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/80 via-primary to-primary/60 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2ek0wIDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZTMy4zMTQgNiAwIDYtNiA4LjY4Ni02IDEycy4yNjg2IDYgNiA2ek0xOCAzNmMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <Button variant="ghost" size="icon" className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm hover:bg-card" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-card border border-t-0 border-border px-5 sm:px-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
              <AvatarImage src={mentor.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-gold text-2xl font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl font-bold">{mentor.full_name}</h1>
                    <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {mentor.headline || `${mentor.industry || "Startup"} Expert`}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="gap-1.5 text-xs font-semibold" onClick={() => setBookingOpen(true)}>
                    <Calendar className="h-3.5 w-3.5" /> Book a Session
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setQuickChatOpen(true)}>
                    <MessageCircle className="h-3.5 w-3.5" /> Quick Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Bio */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> About
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mentor.bio || "This mentor hasn't added a bio yet."}
            </p>
          </div>

          {/* Expertise */}
          {mentor.expertise && mentor.expertise.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Areas of Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map(skill => (
                  <Badge key={skill} className="bg-primary/10 text-primary border-0 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Reviews ({mentor.reviews_count})
            </h3>
            <div className="space-y-4">
              {demoReviews.map((review, i) => (
                <div key={i} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{review.name}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 text-primary fill-primary" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{review.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:w-72 shrink-0 space-y-5">
          {/* Stats Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-4">Mentor Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sessions</span>
                <span className="text-sm font-bold text-primary">{mentor.sessions_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reviews</span>
                <span className="text-sm font-bold text-foreground">{mentor.reviews_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="text-sm font-bold text-foreground">{mentor.rating}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold">{mentor.attendance_rate}%</span>
                </div>
                <Progress value={mentor.attendance_rate} className="h-1.5" />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Availability</h3>
            <div className="flex items-center gap-2">
              {mentor.availability === "available_now" ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
                  <span className="text-sm text-secondary font-medium">Available Now</span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-sm text-primary font-medium">Book in Advance</span>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Details</h3>
            <div className="space-y-3">
              {mentor.location && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> <span>{mentor.location}</span>
                </div>
              )}
              {mentor.industry && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" /> <span>{mentor.industry}</span>
                </div>
              )}
              {mentor.years_experience && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" /> <span>{mentor.years_experience} years experience</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
            <h3 className="font-display font-bold text-sm mb-2">Ready to grow?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Book a 1:1 session with {mentor.full_name?.split(" ")[0]}
            </p>
            <Button className="w-full text-xs font-semibold" onClick={() => setBookingOpen(true)}>
              <Calendar className="h-3.5 w-3.5 mr-1" /> Book a Session
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <QuickChatDialog
        open={quickChatOpen}
        onClose={() => setQuickChatOpen(false)}
        targetUserId={mentor.id}
        targetUserName={mentor.full_name || "Mentor"}
        targetUserAvatar={mentor.avatar_url}
        onOpenFullChat={onOpenMessages}
      />
      <BookSessionDialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        mentor={mentor}
      />
    </div>
  );
};

export default MentorDetailPage;
