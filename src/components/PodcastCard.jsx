export default function PodcastCard({ podcast }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col transition-transform hover:scale-105 hover:shadow-lg">
      <div className="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg bg-muted">
        <img src={podcast.thumbnail} alt={podcast.title} className="object-cover w-full h-full" />
      </div>
      <h2 className="font-heading text-xl font-bold text-secondary mb-1 truncate">{podcast.title}</h2>
      <p className="text-gray-500 text-sm mb-3">{podcast.channel}</p>
      <button className="mt-auto bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition-colors">
        Download MP4
      </button>
    </div>
  );
} 