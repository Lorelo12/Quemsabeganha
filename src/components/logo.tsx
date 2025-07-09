// I've temporarily switched to a standard <img> tag for easier debugging.
// We can switch back to the optimized <Image> component once this is working.
export function Logo() {
  return (
    <div className="flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Quem Sabe, Ganha! Logo"
        className="w-full max-w-md"
        // Setting aspect ratio to prevent layout shift, similar to width/height in next/image
        style={{ aspectRatio: '500 / 350' }}
      />
    </div>
  );
}
