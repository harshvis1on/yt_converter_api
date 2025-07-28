export default function Footer() {
  return (
    <footer className="bg-muted text-center text-gray-500 py-6 mt-12 border-t">
      <span className="text-primary font-bold">&copy; {new Date().getFullYear()} YouTube Podcast</span>. All rights reserved.
    </footer>
  );
} 