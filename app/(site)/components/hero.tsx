import ModelCard from "./card/model-card";

const IMAGE_URL = "https://public-cdn.bblmw.cn/operation/d5053015aa8bc626.png?x-oss-process=image/resize,w_1920/format,webp";

const images = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  src: IMAGE_URL,
  alt: `Image ${i + 1}`,
  title: `model model model model model model model ${i + 1}`,
  author: {
    name: `author${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
  },
  stats: {
    views: Math.floor(Math.random() * 10000),
    likes: Math.floor(Math.random() * 1000),
    downloads: Math.floor(Math.random() * 500),
  }
}));

export default function Hero() {
  return (
    <div className="w-full grid grid-cols-5 grid-rows-2 gap-5 py-5">
      <div className="w-full h-full col-span-5 row-span-2 md:col-span-5 lg:col-span-2 bg-blue-50 rounded-lg">
        <ModelCard 
          ratio={4 / 3.045}
          image={images[0].src} 
          alt={images[0].alt} 
          title={images[0].title}
          author={images[0].author}
          stats={images[0].stats}
          isFeature={true}
          id={images[0].id}
        />
      </div>
      <div className="w-full h-full col-span-5 row-span-2 md:col-span-5 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.slice(1).map((image, index) => (
          <ModelCard 
            key={index} 
            image={image.src} 
            alt={image.alt} 
            title={image.title}
            author={image.author}
            stats={image.stats}
            isFeature={true}
            id={image.id}
          />
        ))}
      </div>
    </div>
  );
}