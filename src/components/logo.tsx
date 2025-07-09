import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex justify-center">
      <Image
        src="https://placehold.co/512x512.png"
        data-ai-hint="logo"
        alt="Quem Sabe, Ganha! Logo"
        width={512}
        height={512}
        priority
        className="w-full max-w-xs md:max-w-sm"
      />
    </div>
  );
}
