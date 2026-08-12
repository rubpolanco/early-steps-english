import { getSession } from "@/lib/auth";
import { getMediaForGuardian, getMediaStudentTags } from "@/lib/queries";
import { SectionTitle, EmptyState } from "@/components/ui";
import { getDict } from "@/lib/i18n";

export default async function ParentPhotosPage() {
  const session = await getSession();
  if (!session) return null;
  const media = getMediaForGuardian(session.sub, 100);
  const { locale, t } = await getDict();
  const s = t.parentApp.photos;

  return (
    <div>
      <SectionTitle>{s.title}</SectionTitle>
      {media.length === 0 ? (
        <EmptyState icon="📸" title={s.noMedia} subtitle={s.noMediaSubtitle} />
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
                  <p className="text-[11px] text-brand-navy/40 mt-1">{new Date(m.created_at).toLocaleDateString(locale === "es" ? "es-ES" : "en-US")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
