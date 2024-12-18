"use client";

import { useState } from "react";
import { TranscriptionResult, TranscriptionSegment } from "@/types";
import { transcribeAudio, fetchPexelsImage } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState("");

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
      const transcription = await transcribeAudio(formData);

      const segmentsWithImages = await Promise.all(
        transcription.segments.map(async (segment) => {
          const image = await fetchPexelsImage(segment.text);
          return {
            ...segment,
            image,
          };
        })
      );

      setResult({
        ...transcription,
        segments: segmentsWithImages,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process audio");
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image");
    }
  };

  const handleDownloadAll = async () => {
    if (!result) return;

    try {
      for (let i = 0; i < result.segments.length; i++) {
        const segment = result.segments[i];
        if (segment.image) {
          const fileName = `${folderPath}/${i + 1}.png`.replace(/\/+/g, "/");
          await handleDownload(segment.image, fileName);
        }
      }
      alert("All images downloaded successfully!");
    } catch (error) {
      console.error("Error downloading all images:", error);
      alert("Failed to download all images");
    }
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">
        Audio Transcription with Images
      </h1>

      <form action={handleSubmit} className="mb-8">
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            name="audio"
            accept="audio/mpeg"
            className="block w-full max-w-md text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
        </div>
      </form>

      {result && (
        <div className="grid gap-6">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-2">Full Transcription</h2>
            <p className="text-gray-700">{result.text}</p>
          </Card>

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                type="text"
                placeholder="Folder path for downloads (e.g., images/)"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={handleDownloadAll} disabled={!folderPath}>
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>
            <div className="grid gap-4">
              {result.segments.map((segment, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {segment.image && (
                        <div className="w-full md:w-1/3 relative">
                          <img
                            src={segment.image}
                            alt={`Visual representation of: ${segment.text}`}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 right-2"
                            onClick={() =>
                              handleDownload(
                                segment.image,
                                `${folderPath}/${index + 1}.png`.replace(
                                  /\/+/g,
                                  "/"
                                )
                              )
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                      <div className="w-full md:w-2/3">
                        <p className="text-sm text-gray-700">{segment.text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {segment.start}s - {segment.end}s
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
