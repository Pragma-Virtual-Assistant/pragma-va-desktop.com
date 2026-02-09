import React from 'react';
import { Hero } from './components/Hero';
import { HowItHelps } from './components/HowItHelps';
import { Examples } from './components/Examples';
import { WaitlistForm } from './components/WaitlistForm';
import { IdeaForm } from './components/IdeaForm';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

function App() {
    const scrollToWaitlist = () => {
        const el = document.getElementById('waitlist');
        el?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <Hero onJoinClick={scrollToWaitlist} />
            <HowItHelps />
            <Examples />

            <section id="waitlist" className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Join the early-access waitlist</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                            Help shape the roadmap and get <span className="text-blue-600 font-bold">3 months free</span> and after <span className="text-blue-600 font-bold">50% off</span> your first year when we launch.
                        </p>
                        <WaitlistForm />
                    </div>

                    <div className="pt-16 border-t border-gray-200 dark:border-gray-800 mt-16">
                        <IdeaForm />
                    </div>
                </div>
            </section>

            <ContactSection />
            <Footer />
        </div>
    );
}

export default App;
