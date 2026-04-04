"use client";

import Header from "@/components/dashboard/header";

export default function HeaderClientWrapper({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return <Header title={title} subtitle={subtitle} />;
}
