import Image from "next/image"

export function HeroSection() {
  return (
    <section className="w-full pt-2 pb-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-2">
            <Image
              src="/hero-banner.png"
              alt="Your users need to be HEARD"
              width={800}
              height={400}
              className="mx-auto max-w-full h-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
