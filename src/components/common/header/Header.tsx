import NavLinks from "@/components/common/header/NavLinks";
import Image from "next/image";

export default function TopNavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between max-w-7xl px-10">
        <div className="flex flex-row gap-2 items-center">
          <Image
            src="/theory-round.avif"
            alt="Theory6 Logo"
            width={50}
            height={50}
            className="rounded-lg"
          />
          <span className="font-sans font-semibold text-xl">
            Scouting Tools
          </span>
        </div>
        <NavLinks />
      </div>
    </header>
  );
}
