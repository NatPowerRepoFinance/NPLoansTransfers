export type HelpSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  body: React.ReactNode;
};

export type QuickStartStep = {
  title: string;
  desc: string;
  img: string;
};

export type FAQItem = {
  q: string;
  a: string;
};
