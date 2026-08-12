import { getSession } from "@/lib/auth";
import { getMediaForGuardian, getMediaStudentTags } from "@/lib/queries";
import { SectionTitle, EmptyState } from "@/components/ui";

export default async function ParentPhotosPage() {
  const session = await getSession();
  if (!session) return null;
  const media = getMediaForGuardian(session.sub, 100);

  return (
    <div>
      <SectionTitle>Photos & Videos</SectionTitle>
      {media.length === 0 ? (
        <EmptyState icon="📸" title="No photos yet" subtitle="Photos your teachers share will show up here." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {media.map((m) => {
            const tags = getMediaStudentTags(m.id);
            return (
              <div key={m.id} className="card overflow-hidden">
                {m.type === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.file_url} alt={m.caption ?? ""} className="w-full h-40 object-cover" />
                ) : (
                  <video src={m.file_url} controls className="w-full h-40 object-cover" />
                )}
                <div className="p-3">
                  {m.caption && <p className="text-xs text-brand-navy font-medium">{m.caption}</p>}
                  {tags.length > 0 && <p className="text-[11px] text-brand-navy/60 mt-1">{tags.map((t) => t.first_name).join(", ")}</p>}
                  <p className="text-[11px] text-brand-navy/40 mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
