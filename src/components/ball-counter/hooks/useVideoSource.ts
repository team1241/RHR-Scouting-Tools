import { useEffect, useRef, useState } from "react";
import { parseYouTubeId } from "@/lib/youtube";

export type SourceType = "html5" | "youtube" | null;

export default function useVideoSource() {
  const objectUrlRef = useRef<string | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [loadedVideoUrl, setLoadedVideoUrl] = useState("");
  const [loadedVideoLabel, setLoadedVideoLabel] = useState("");
  const [selectedSource, setSelectedSource] = useState<"youtube" | "local">(
    "youtube",
  );
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [youtubeId, setYouTubeId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearObjectUrl();
    };
  }, [clearObjectUrl]);

  const loadFromUrl = () => {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError("Add a YouTube URL or upload a local video.");
      return false;
    }
    const youTubeId = parseYouTubeId(trimmed);
    if (youTubeId) {
      setError("");
      clearObjectUrl();
      setSourceType("youtube");
      setYouTubeId(youTubeId);
      setLoadedUrl("");
      setLoadedVideoUrl(trimmed);
      setLoadedVideoLabel(trimmed);
      return true;
    }
    setError("Only YouTube links are supported.");
    return false;
  };

  const loadFromFile = (file: File | null) => {
    if (!file) return false;
    clearObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setError("");
    setVideoUrl("");
    setSourceType("html5");
    setYouTubeId(null);
    setLoadedUrl(objectUrl);
    setLoadedVideoUrl(`local:${file.name}`);
    setLoadedVideoLabel(file.name);
    return true;
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    setError("");
  };

  const handleSourceChange = (value: "youtube" | "local") => {
    setSelectedSource(value);
    setError("");
  };

  return {
    error,
    loadedUrl,
    loadedVideoLabel,
    loadedVideoUrl,
    loadFromFile,
    loadFromUrl,
    handleSourceChange,
    handleVideoUrlChange,
    selectedSource,
    sourceType,
    videoUrl,
    youtubeId,
  };
}
