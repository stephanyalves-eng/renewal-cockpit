import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const TOUR_VIDEO = "/video/renewal-cockpit-tour.mp4";
export const TOUR_POSTER = "/video/renewal-cockpit-tour-poster.jpg";

/** "Watch the tour" button that opens the narrated walkthrough (subtitles are burned into the video). */
export function VideoTour() {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-[2px] border border-input bg-card px-3 py-1.5 text-sm font-medium text-forest hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
        <Play className="h-4 w-4" aria-hidden="true" />
        Watch the 80-second tour
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl gap-3 rounded-[4px] p-3 sm:p-4">
        <div className="pr-8">
          <DialogTitle className="text-base font-medium">Project tour</DialogTitle>
          <DialogDescription className="mt-1">Narrated, with subtitles · 1 min 21 s · synthetic data</DialogDescription>
        </div>
        <video
          className="aspect-video max-h-[calc(100dvh-8rem)] w-full bg-forest object-contain"
          src={TOUR_VIDEO}
          poster={TOUR_POSTER}
          controls
          autoPlay
          playsInline
          preload="none"
        >
          Your browser can't play this video. <a href={TOUR_VIDEO}>Download it</a> instead.
        </video>
      </DialogContent>
    </Dialog>
  );
}
