import "@/index.css";
import "@/lib/analytics";
import { mount } from "@/lib/mount";
import GuidePage from "./Page";
import GuidesIndex from "./Index";
import { GUIDES } from "./data";

// One entry for the hub and every guide: the path picks the page, matching the pre-rendered HTML.
const slug = location.pathname.split("/").filter(Boolean)[1];
const guide = GUIDES.find(g => g.slug === slug);
mount(guide ? <GuidePage guide={guide} /> : <GuidesIndex />);
