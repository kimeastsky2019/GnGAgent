import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import UseCase from "@/components/sections/UseCase";
import Process from "@/components/sections/Process";
import Trust from "@/components/sections/Trust";
import CTA from "@/components/sections/CTA";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between bg-white">
            <Hero />
            <Problem />
            <Solution />
            <UseCase />
            <Process />
            <Trust />
            <CTA />
        </main>
    );
}
