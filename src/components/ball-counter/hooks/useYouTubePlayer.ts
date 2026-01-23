import { useEffect, useRef } from "react";

export type YouTubePlayer = {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubePlayerConstructor = new (
  element: HTMLElement,
  options: {
    videoId: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: () => void;
    };
  },
) => YouTubePlayer;

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type UseYouTubePlayerOptions = {
  isYouTube: boolean;
  youtubeId: string | null;
};

export default function useYouTubePlayer({
  isYouTube,
  youtubeId,
}: UseYouTubePlayerOptions) {
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    if (!isYouTube || !youtubeId) return;
    let cancelled = false;

    const loadPlayer = () => {
      if (!youtubeContainerRef.current) return;
      const Player = window.YT?.Player;
      if (!Player) return;
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.loadVideoById(youtubeId);
        return;
      }

      youtubePlayerRef.current = new Player(youtubeContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            if (cancelled || !youtubePlayerRef.current) return;
          },
        },
      });
    };

    const ensureYouTubeApi = () => {
      if (window.YT?.Player) {
        loadPlayer();
        return;
      }
      if (document.getElementById("youtube-iframe-api")) {
        const poll = window.setInterval(() => {
          if (window.YT?.Player) {
            window.clearInterval(poll);
            loadPlayer();
          }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = () => {
        if (!cancelled) {
          loadPlayer();
        }
      };
    };

    ensureYouTubeApi();

    return () => {
      cancelled = true;
    };
  }, [isYouTube, youtubeId]);

  useEffect(() => {
    if (isYouTube) return;
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }
  }, [isYouTube]);

  return { youtubeContainerRef, youtubePlayerRef };
}
