import { courseMedia } from "@/lib/student/course-media";
export default function CourseVideo({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const media = courseMedia(url);
  if (!media)
    return <p role="alert">ভিডিওর লিংকটি সঠিক নয়। অ্যাডমিনকে জানান।</p>;
  return (
    <div className="space-y-3">
      {media.type === "youtube" ? (
        <iframe
          className="aspect-video w-full rounded-xl bg-black"
          src={media.src}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : media.type === "video" ? (
        <video
          className="aspect-video w-full rounded-xl bg-black"
          src={media.src}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <p>এই ভিডিও provider-এর জন্য সরাসরি লিংক ব্যবহার করুন।</p>
      )}
      <a
        className="text-sm text-primary underline"
        href={media.original}
        target="_blank"
        rel="noopener noreferrer"
      >
        ভিডিও চালু না হলে মূল লিংকে দেখুন ↗
      </a>
    </div>
  );
}
