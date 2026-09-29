import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { PageHeader, Empty } from "../components/bits";
import { IllusShield } from "@/components/brand/illustrations";

// Platform labs placeholder while the Connect your lab guide is in development.
export default function Soon() {
  return (
    <>
      <PageHeader icon={FlaskConical} title="Connect your lab" sub="Practise the Pacific Crest tickets in a Microsoft Entra tenant, then grade a read-only export in the browser." />
      <Empty art={IllusShield} title="The Entra ID lab is in early access">
        <p className="mb-4"><EarlyAccess /></p>
        <p>The setup guide, seed and export scripts, and in-browser grading are in development.</p>
        <Button asChild className="mt-5 font-bold"><a href="/labs/#waitlist">Join the lab waitlist</a></Button>
      </Empty>
    </>
  );
}
