"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  let accumulatedPath = "";

  return (
    <nav className="mb-4 flex items-center text-sm text-[#666666] space-x-1">
      <Link href="/" className="text-[#B89B2B] hover:underline">
        Home
      </Link>
      {segments.map((segment, index) => {
        accumulatedPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label = decodeURIComponent(segment);
        return (
          <span key={accumulatedPath} className="flex items-center space-x-1">
            <span className="mx-1 text-[#666666]">/</span>
            {isLast ? (
              <span className="text-[#333333] font-medium capitalize">
                {label}
              </span>
            ) : (
              <Link
                href={accumulatedPath}
                className="text-[#B89B2B] hover:underline capitalize"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
