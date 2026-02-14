import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata = {
  title: "MeetUp — Video Calls, Chat & Collaboration",
  description:
    "Free video conferencing with real-time chat, screen sharing, and crystal-clear audio. Connect instantly with anyone, anywhere.",
  keywords: "video call, meeting, chat, screen share, conferencing, free",
  openGraph: {
    title: "MeetUp — Video Calls, Chat & Collaboration",
    description:
      "Free video conferencing with real-time chat, screen sharing, and crystal-clear audio.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body>{children}</body>
    </html>
  );
}
