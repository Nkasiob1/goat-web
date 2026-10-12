// app/radar/page.js: the /radar page
import RadarView from "@/components/RadarView"; // all the UI lives here

export const metadata = {
  title: "Launch Radar | GOAT",
  description: "New crypto coins and exchange listings, safety-checked every 15 minutes.",
};

export default function RadarPage() {
  return <RadarView />;
}