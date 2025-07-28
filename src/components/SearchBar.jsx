export default function SearchBar({ onSearch }) {
  return (
    <div className="flex justify-center my-8">
      <input
        type="text"
        placeholder="Paste YouTube link or search podcast..."
        className="w-full max-w-xl px-6 py-3 border border-muted rounded-l-xl shadow focus:outline-none focus:ring-2 focus:ring-primary text-lg bg-white"
      />
      <button className="bg-primary text-white px-6 py-3 rounded-r-xl font-semibold text-lg hover:bg-secondary transition-colors">
        Search
      </button>
    </div>
  );
} 