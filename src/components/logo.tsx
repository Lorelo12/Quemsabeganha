import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/logo.png"
        alt="Quem Sabe, Ganha! Logo"
        width={512}
        height={512}
        priority
        className="w-full max-w-xs md:max-w-sm"
      />
    </div>
  );
}
