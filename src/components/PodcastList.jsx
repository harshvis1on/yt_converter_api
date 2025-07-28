import PodcastCard from './PodcastCard';

const placeholderPodcasts = [
  {
    id: 1,
    title: "Sample Podcast 1",
    channel: "Channel One",
    thumbnail: "https://via.placeholder.com/320x180.png?text=Thumbnail+1"
  },
  {
    id: 2,
    title: "Sample Podcast 2",
    channel: "Channel Two",
    thumbnail: "https://via.placeholder.com/320x180.png?text=Thumbnail+2"
  },
  // Add more as needed
];

export default function PodcastList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-6">
      {placeholderPodcasts.map(podcast => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
} 