declare const defineBackground: (options: {
  persistent?: boolean;
  main: () => void;
}) => unknown;

declare const defineContentScript: (options: {
  matches: string[];
  allFrames?: boolean;
  matchAboutBlank?: boolean;
  runAt?: "document_start" | "document_end" | "document_idle";
  main: () => void;
}) => unknown;
