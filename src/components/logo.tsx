export function Logo() {
  return (
    <div className="relative mb-4 select-none flex justify-center">
      <div className="relative inline-block bg-neon-pink p-2 pb-4 rounded-t-lg rounded-b-md shadow-lg"
           style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 80% 85%, 20% 85%, 0 100%)' }}
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase">
          <span className="text-white">Quiz</span>
          <span className="block text-neon-yellow text-shadow-neon-yellow -mt-2">Milionário</span>
        </h1>
      </div>
    </div>
  );
}
