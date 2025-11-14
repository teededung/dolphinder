import { Send, Facebook, ExternalLink, Link2, Users, MessageSquare, FolderKanban, BookOpen, Shield, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import dolphinderLogo from '../../assets/dolphinder-logo.png';
import { useEffect, useState } from 'react';

export default function AboutContent() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-16">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src={dolphinderLogo.src}
              alt="Dolphinder Logo"
              className="h-24 w-auto md:h-32"
              width={dolphinderLogo.width}
              height={dolphinderLogo.height}
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-6xl">
            About Dolphinder
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-white/80 md:text-2xl">
            Sui Developer Community - Where we connect, share, and grow together
          </p>
        </div>

        {/* Community Section */}
        <section className="mb-20">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <img
                src="/sui-logo.svg"
                alt="Sui Logo"
                className="h-16 w-auto md:h-20"
                loading="eager"
              />
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Sui Developer Community
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-white/70">
              Dolphinder is where developers interested in Sui blockchain meet, connect, and grow together. 
              We build an environment where everyone can share knowledge, support each other, and together build the Sui ecosystem.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/30">
              <Users className="mb-4 h-10 w-10 text-white/80" />
              <h3 className="mb-2 text-xl font-semibold">Connect & Discover</h3>
              <p className="text-white/60">
                Find and connect with developers who share your passion for Sui blockchain
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/30">
              <MessageSquare className="mb-4 h-10 w-10 text-white/80" />
              <h3 className="mb-2 text-xl font-semibold">Discuss & Support</h3>
              <p className="text-white/60">
                Discuss, share experiences, and support each other on your development journey
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/30">
              <FolderKanban className="mb-4 h-10 w-10 text-white/80" />
              <h3 className="mb-2 text-xl font-semibold">Project Showcase</h3>
              <p className="text-white/60">
                Display and share your personal projects, showcase your achievements with pride
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/30">
              <BookOpen className="mb-4 h-10 w-10 text-white/80" />
              <h3 className="mb-2 text-xl font-semibold">Knowledge Sharing</h3>
              <p className="text-white/60">
                Learn and share knowledge about Sui blockchain, Move programming, and Web3
              </p>
            </div>
          </div>
        </section>

        {/* Workshop Gallery Section */}
        <section className="mb-20">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Workshop Moments
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Memorable moments from our workshops where we learn and grow together
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm transition-all hover:border-white/20">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/dolphinder-1.jpg"
                  alt="Dolphinder Workshop - Moment 1"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `translateY(${scrollY * 0.05}px) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-white/60">
                  Workshop SuiHub APAC - Cộng đồng Dolphinder
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm transition-all hover:border-white/20">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/dolphinder-2.jpg"
                  alt="Dolphinder Workshop - Moment 2"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `translateY(${scrollY * -0.05}px) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-white/60">
                  Workshop SuiHub APAC - Cộng đồng Dolphinder
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Onchain Data & Web3 Section */}
        <section className="mb-20">
          <div className="rounded-lg border border-white/10 bg-gradient-to-br from-blue-950/30 via-slate-900/50 to-purple-950/30 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-6 flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <h2 className="text-3xl font-bold md:text-4xl">
                Onchain Data & Web3 Ownership
              </h2>
            </div>

            <div className="mx-auto max-w-4xl space-y-6">
              <p className="text-center text-lg text-white/80">
                Dolphinder encourages developers to push their data onchain to Sui + Walrus to increase transparency and data ownership for each developer.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold">Transparency</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    Your data is stored publicly on the blockchain, transparent and verifiable
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold">Ownership</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    You are the true owner of your data, independent of any centralized platform
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-semibold">Data Persistence</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    Data is permanently stored on the blockchain and Walrus storage, never lost
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-blue-500/30 bg-blue-950/20 p-6">
                <h3 className="mb-3 text-xl font-semibold text-blue-300">
                  Future Roadmap
                </h3>
                <p className="mb-4 text-white/80">
                  Once the onchain data upload feature is complete and launched on mainnet, Dolphinder will load your complete onchain data. 
                  This confirms that your profile is always active on Web3.
                </p>
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-4">
                  <Coins className="mt-0.5 h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-semibold text-yellow-300">Incentive Program</p>
                    <p className="mt-1 text-sm text-white/70">
                      Developers using WALRUS with active participation will have the opportunity to receive WAL/SUI tokens
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Join the Dolphinder Community
          </h2>
          <p className="mb-8 mx-auto max-w-2xl text-lg text-white/70">
            Connect with us on social platforms and start your journey with Sui blockchain
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => window.open('https://t.me/dolphinder', '_blank')}
              className="bg-[#0088cc] text-white hover:bg-[#006ba3] flex items-center gap-2"
              size="lg"
            >
              <Send className="h-5 w-5" />
              Join Telegram
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => window.open('https://www.facebook.com/groups/688138073614433', '_blank')}
              className="bg-[#1877f2] text-white hover:bg-[#1565c0] flex items-center gap-2"
              size="lg"
            >
              <Facebook className="h-5 w-5" />
              Join Facebook Group
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => (window.location.href = '/register')}
              className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
              size="lg"
            >
              Get Started
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

