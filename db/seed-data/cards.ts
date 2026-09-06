import type { Rarity } from "@/db/schema";

export type SeedCard = {
  number: number;
  name: string;
  description: string;
  rarity: Rarity;
  imageUrl: string;
  signed?: boolean;
};

function art(rarity: Rarity) {
  return `/cards/${rarity}.svg`;
}

/** First finished card art — always pinned on /admin/dev. */
export const FEATURED_SHOWCASE_CARD: SeedCard = {
  number: 4,
  name: "Zatłoczone miejsce",
  description:
    "Obraz stanowiący wskazówkę do otwarcia sejfu w grze Dishonored. „No są ludzie, i co dalej?”",
  rarity: "common",
  imageUrl: "/cards/zatloczone-miejsce.png",
  signed: false,
};

export const FEATURED_SHOWCASE_SIGNED_CARD: SeedCard = {
  number: 4,
  name: "Zatłoczone miejsce",
  description:
    "Obraz stanowiący wskazówkę do otwarcia sejfu w grze Dishonored. „No są ludzie, i co dalej?”",
  rarity: "common",
  imageUrl: "/cards/zatloczone-miejsce-signed.png",
  signed: true,
};

export const SEED_CARDS: SeedCard[] = [
  { number: 1, name: "Chat Cadet", description: "First to say hi, last to leave lurk. A faithful presence in every stream.", rarity: "common", imageUrl: art("common") },
  { number: 2, name: "First Follow", description: "The click heard around the channel. A small bell, a big commitment.", rarity: "common", imageUrl: art("common") },
  { number: 3, name: "Emote Enthusiast", description: "Communicates exclusively in 7-pixel faces. Surprisingly eloquent.", rarity: "common", imageUrl: art("common") },
  FEATURED_SHOWCASE_CARD,
  FEATURED_SHOWCASE_SIGNED_CARD,
  { number: 5, name: "Clip Catcher", description: "Always recording, never missing the moment that becomes tomorrow's highlight.", rarity: "common", imageUrl: art("common") },
  { number: 6, name: "Raid Rider", description: "Arrives with a crowd, leaves with new friends and a borrowed emote.", rarity: "common", imageUrl: art("common") },
  { number: 7, name: "Sub Hype", description: "A burst of confetti every time the bell rings. Infectious energy.", rarity: "common", imageUrl: art("common") },
  { number: 8, name: "Bits Spark", description: "A tiny cheer that lights up the overlay. Small bits, bright spark.", rarity: "common", imageUrl: art("common") },
  { number: 9, name: "Stream Starter", description: "The countdown hits zero. Another night begins.", rarity: "common", imageUrl: art("common") },
  { number: 10, name: "Keyboard Warrior", description: "Fingers faster than the cooldown. Types first, thinks second, apologizes third.", rarity: "common", imageUrl: art("common") },
  { number: 11, name: "Late Night Viewer", description: "Watches when the world is asleep. The 3 a.m. crew is family.", rarity: "common", imageUrl: art("common") },
  { number: 12, name: "Hype Train Car", description: "Not the engine, but the ride is still wild. Hold on.", rarity: "common", imageUrl: art("common") },
  { number: 13, name: "Pog Moment", description: "Mouth open, eyes wide. The universal language of surprise.", rarity: "common", imageUrl: art("common") },
  { number: 14, name: "Copium", description: "It'll work next attempt. It has to. The cope is strong with this one.", rarity: "common", imageUrl: art("common") },
  { number: 15, name: "Hopium", description: "Believe. The drop is coming. The clutch is real. Manifest it.", rarity: "common", imageUrl: art("common") },
  { number: 16, name: "GG Button", description: "Pressed after every win, loss, and accidental disconnect.", rarity: "common", imageUrl: art("common") },
  { number: 17, name: "Water Break", description: "Hydrate or diedrate. A rare moment of self-care mid-raid.", rarity: "common", imageUrl: art("common") },
  { number: 18, name: "BRB Screen", description: "The most honest overlay. They will, in fact, be right back.", rarity: "common", imageUrl: art("common") },
  { number: 19, name: "Mod Hammer", description: "Justice, timeouts, and unwholesome banter — all in a day's work.", rarity: "rare", imageUrl: art("rare") },
  { number: 20, name: "VIP Glow", description: "A golden nametag and a permanent seat in the front row of chat.", rarity: "rare", imageUrl: art("rare") },
  { number: 21, name: "Clutch Play", description: "One HP, one chance, one impossible outplay. Chat loses it.", rarity: "rare", imageUrl: art("rare") },
  { number: 22, name: "Speedrun Split", description: "Gold split. The pace is real. Don't blink.", rarity: "rare", imageUrl: art("rare") },
  { number: 23, name: "Boss Wipe", description: "The raid wipes. Again. Somehow this is still the best part.", rarity: "rare", imageUrl: art("rare") },
  { number: 24, name: "Perfect Timing", description: "Joined chat the exact second the funny thing happened. Coincidence? Never.", rarity: "rare", imageUrl: art("rare") },
  { number: 25, name: "Chat Commander", description: "Calls the shots, reads the room, and never lets a bit die.", rarity: "rare", imageUrl: art("rare") },
  { number: 26, name: "Overlay Artist", description: "The unseen architect of alerts, frames, and that one cursed stinger.", rarity: "rare", imageUrl: art("rare") },
  { number: 27, name: "Sound Alert", description: "A noise so loud it wakes the neighbors. Chat demanded it.", rarity: "rare", imageUrl: art("rare") },
  { number: 28, name: "Channel Beacon", description: "The light that brings wanderers home. Hosts, raids, and returning regulars.", rarity: "rare", imageUrl: art("rare") },
  { number: 29, name: "Hype Train Engine", description: "The locomotive of chaos. Levels climb. Alerts never stop.", rarity: "epic", imageUrl: art("epic") },
  { number: 30, name: "Gift Bomb", description: "A rain of subs from a single generous soul. The chat explodes.", rarity: "epic", imageUrl: art("epic") },
  { number: 31, name: "Unreal Clutch", description: "No one believed it. The VOD will be clipped until the servers die.", rarity: "epic", imageUrl: art("epic") },
  { number: 32, name: "Stream Storm", description: "Viewers spike, chat floods, the overlay weeps. A beautiful disaster.", rarity: "epic", imageUrl: art("epic") },
  { number: 33, name: "Mythic Drop", description: "The item no one has. Until tonight. Chat types in all caps.", rarity: "epic", imageUrl: art("epic") },
  { number: 34, name: "Crown of the Stream", description: "Worn only by those who turned a hobby into a world. Heavy, golden, earned.", rarity: "legendary", imageUrl: art("legendary") },
  { number: 35, name: "Eternal Sub", description: "The streak that never breaks. A bond measured in months and memes.", rarity: "legendary", imageUrl: art("legendary") },
  { number: 36, name: "World Record", description: "The number on the overlay that shouldn't be possible. It is.", rarity: "legendary", imageUrl: art("legendary") },
  { number: 37, name: "The Joker", description: "Rules optional. Chaos mandatory. The wild card that rewrites the night.", rarity: "joker", imageUrl: art("joker") },
];
