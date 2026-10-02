import { Reveal } from "@animations";
import { Suspense, lazy, useEffect, useState } from "react";
import Developers from "./components/Developers.jsx";
import Farmer from "./components/Farmer.jsx";
import Footer from "./components/Footer.jsx";
import Grades from "./components/Grades.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import History from "./components/History.jsx";
import Scan from "./components/Scan.jsx";
import { useLang } from "./i18n/index.jsx";
import { getJSON } from "./lib/api.js";

const Maps = lazy(() => import("./components/Maps.jsx"));

export default function App() {
  const { t } = useLang();
  const [tab, setTab] = useState("live");
  const [grades, setGrades] = useState(null);
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    getJSON("/api/grades").then(setGrades).catch(() => {});
    getJSON("/api/guide").then(setGuide).catch(() => {});
  }, []);

  return (
    <>
      <a className="skip" href="#scan">{t.nav.scan}</a>
      <Header />
      <main>
        <Hero onStart={setTab} />
        <Scan tab={tab} setTab={setTab} grades={grades} />
        <Grades grades={grades} />
        <History />
        <section className="section section--tint" id="map">
          <div className="container">
            <Reveal className="section__head"><h2>{t.map.title}</h2></Reveal>
            <Suspense fallback={<div className="map-skeleton" />}><Maps /></Suspense>
          </div>
        </section>
        <Farmer guide={guide} />
        <Developers />
      </main>
      <Footer />
    </>
  );
}
