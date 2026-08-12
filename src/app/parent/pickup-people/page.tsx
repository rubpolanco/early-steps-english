import { getSession } from "@/lib/auth";
import { getStudentsForGuardian, getPickupPeople } from "@/lib/queries";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { parentAddPickupPerson, parentRemovePickupPerson } from "./actions";

export default async function ParentPickupPeoplePage() {
  const session = await getSession();
  if (!session) return null;
  const children = getStudentsForGuardian(session.sub);

  return (
    <div className="space-y-10">
      <SectionTitle>Authorized Pickup People</SectionTitle>
      <p className="text-sm text-brand-navy/70 -mt-6">
        Add anyone besides yourself who is allowed to pick up your child — a grandparent, an uncle or aunt, a nanny/service maid, a family friend, etc. The front desk will check this list at pickup time.
      </p>

      {children.map((child) => {
        const pickups = getPickupPeople(child.id);
        return (
          <div key={child.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={`${child.first_name} ${child.last_name}`} url={child.photo_url} />
              <p className="font-heading font-bold text-brand-navy">{child.first_name}</p>
            </div>

            <div className="card divide-y divide-brand-navy/5 mb-3">
              {pickups.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <Avatar name={p.name} url={p.photo_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-navy text-sm">{p.name}</p>
                    <p className="text-xs text-brand-navy/60">{p.relationship} {p.phone && `· ${p.phone}`}</p>
                  </div>
                  <Badge color="yellow">PIN {p.pin_code}</Badge>
                  <form action={parentRemovePickupPerson}>
                    <input type="hidden" name="studentId" value={child.id} />
                    <input type="hidden" name="pickupId" value={p.id} />
                    <button className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                </div>
              ))}
              {pickups.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No one added yet — only parents/guardians can pick up {child.first_name}.</p>}
            </div>

            <form action={parentAddPickupPerson} className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input type="hidden" name="studentId" value={child.id} />
              <input name="name" placeholder="Full name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
              <input name="relationship" placeholder="Relationship (e.g. Grandmother, Nanny)" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
              <input name="phone" placeholder="Phone" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
              <input name="pin" placeholder="4-digit PIN (optional)" maxLength={4} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
              <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-4">+ Add authorized pickup person</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
