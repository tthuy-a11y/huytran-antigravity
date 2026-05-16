import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      {/* Hero section của bạn */}
      <Skills />
      <Projects />
      <About />
      <Contact />
    </>
  );
}