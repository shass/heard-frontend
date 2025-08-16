import Image from "next/image"

export function HeroSection() {
  return (
    <section className="w-full pt-16 pb-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="mb-2 flex flex-col items-center w-full max-w-[600px]">
            <h1 className="mb-4 leading-tight whitespace-nowrap font-medium hero-title">
              Everyone Will Be
            </h1>
            <div className="w-full max-w-[540px]">
              <Image
                src="/hero-banner.png"
                alt="HEARD Logo"
                width={760}
                height={265}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="mt-4 whitespace-nowrap hero-subtitle">
              Surveys gated by verified Web2 & Web3 behavior
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
