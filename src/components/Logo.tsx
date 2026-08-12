import Image from "next/image";
import Link from "next/link";

export function Logo({
  size = 40,
  withText = true,
  href = "/",
}: {
  size?: number;
  withText?: boolean;
  href?: string | null;
}) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white shadow-sm"
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/logo.jpeg"
          alt="Early Steps English logo"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </span>
      {withText && (
        <span className="leading-tight">
          <span className="block font-heading font-bold text-brand-navy tracking-tight" style={{ fontSize: size * 0.42 }}>
            Early Steps English
          </span>
          <span className="block text-brand-blue-dark/80 font-medium" style={{ fontSize: size * 0.22 }}>
            Centro de Inglés Infantil
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
