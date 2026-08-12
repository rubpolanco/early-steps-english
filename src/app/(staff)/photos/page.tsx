import { getSchool, getClassrooms, getStudents, getMediaForSchool, getMediaStudentTags } from "@/lib/queries";
import { SectionTitle, EmptyState } from "@/components/ui";
import { uploadMedia } from "./actions";
import { getDict } from "@/lib/i18n";

export default async function PhotosPage() {
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const media = getMediaForSchool(school.id);
  const { locale, t } = await getDict();
  const s = t.staffApp.photos;

  return (
    <div className="space-y-8">
      <SectionTitle>{s.title}</SectionTitle>

      <form action={uploadMedia} className="card p-5 space-y-3" encType="multipart/form-data">
        <p className="text-sm font-semibold text-brand-navy">{s.shareAMoment}</p>
        <input type="file" name="file" accept="image/*,video/*" required className="text-sm" />
        <input name="caption" placeholder={s.caption} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="">{s.noClassroomOption}</option>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="text-xs text-brand-navy/70">
            <p className="font-semibold mb-1">{s.tagChildrenOptionalLabel}</p>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {students.map((st) => (
                <label key={st.id} className="flex items-center gap-1 bg-brand-sky-light rounded-lg px-2 py-1">
                  <input type="checkbox" name="studentIds" value={st.id} />
                  {st.first_name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary px-4 py-2 text-sm">{t.common.upload}</button>
      </form>

      {media.length === 0 ? (
        <EmptyState icon="📸" title={s.noPhotosTitle} subtitle={s.noPhotosSubtitle} />
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
                  {tags.length > 0 && (
                    <p className="text-[11px] text-brand-navy/60 mt-1">{tags.map((t) => t.first_name).join(", ")}</p>
                  )}
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
