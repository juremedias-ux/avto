import { VideoCard, type VideoCardData } from "@/components/video/video-card";

export function VideoGrid({ videos }: { videos: VideoCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
