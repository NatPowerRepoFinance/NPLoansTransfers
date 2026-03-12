import UserSection from "./UserSection";

export default function Navbar() {
  return (
    <header className="w-full min-h-[60px] bg-[#1d2636] text-white text-2xl font-semibold px-5 sm:px-10 py-3 flex justify-between items-center">
      <div className="flex-shrink-0">
        <a
          className="text-white flex gap-2 items-center transition duration-200 hover:text-gray-200 active:scale-95"
          href="/"
          title="Home"
        >
          <img
            src="/Natpower_PO.png"
            alt="Natpower PO Logo"
            className="h-6 sm:h-8 object-contain transition-transform duration-200 hover:scale-105"
          />
          <h3 className="font-medium">Loans and Transfers</h3>
        </a>
      </div>

      <div>
        <UserSection />
      </div>
    </header>
  );
}
