import { getSchool, getClassrooms, getStudents, getMediaForSchool, getMediaStudentTags } from "@/lib/queries";
import { SectionTitle, EmptyState } from "@/components/ui";
import { uploadMedia } from "./actions";

export default async function PhotosPage() {
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const media = getMediaForSchool(school.id);

  return (
    <div className="space-y-8">
      <SectionTitle>Photos & Videos</SectionTitle>

      <form action={uploadMedia} className="card p-5 space-y-3" encType="multipart/form-data">
        <p className="text-sm font-semibold text-brand-navy">Share a moment</p>
        <input type="file" name="file" accept="image/*,video/*" required className="text-sm" />
        <input name="caption" placeholder="Caption" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="">No classroom</option>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="text-xs text-brand-navy/70">
            <p className="font-semibold mb-1">Tag children (optional)</p>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-1 bg-brand-sky-light rounded-lg px-2 py-1">
                  <input type="checkbox" name="studentIds" value={s.id} />
                  {s.first_name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary px-4 py-2 text-sm">Upload</button>
      </form>

      {media.length === 0 ? (
        <EmptyState icon="📸" title="No photos yet" subtitle="Uploads will appear here and in parents' feeds." />
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
