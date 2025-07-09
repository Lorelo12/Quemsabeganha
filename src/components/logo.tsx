import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/logo.png"
        alt="Quem Sabe, Ganha! Logo"
        width={500}
        height={350}
        className="w-full max-w-md"
        priority
      />
    </div>
  );
}
